# Using the Emulator

## Installing
First, you need to install the Firebase Emulators.

Run
```
firebase init emulators
```
and install these three:

- `functions`
- `storage`
- `pub/sub`

For more detail, the emulators [are described in the Firebase docs](https://firebase.google.com/docs/emulator-suite/install_and_configure#configure_emulator_suite).

## Running It
Emulator creates a local version of what we have on Firebase console. 

### Setting Host
Before you start the emulator, you need to specify the emulator host. You can pass that in when you start up the emulator, or set it in the bash profile.

_`bash_profile` method_

Simply add this to `~.bash_profile`:

```
export FIRESTORE_EMULATOR_HOST="localhost:8080"
```

This works fine, but you have to remember to comment that out when you want to connect to prod Firestore

_in command_

This method is probably better, I recommend just setting this as an alias:

```
FIRESTORE_EMULATOR_HOST="localhost:8080" firebase emulators:start
```

### Actually Starting It
 To start emulator, run:
 
```
firebase emulators:start
```
if you have changes you need to include, run:

```
yarn && yarn build && firebase emulators:start
```
I set up an alias in `.bash_profile` to run this easier: [1]

```
alias yem="yarn && yarn build && firebase emulators:start"
```
Once that's started, it will give you a `localhost` address to go to, like [localhost:4000](http://localhost:4000/). From there, you'll have access to the three emulators. However, they'll be empty.

## Re-using Data
By default, the emulator starts from a clean slate with no data, each time. 

I recommend re-using the data whenever possible. Setting up the data takes a long time because: the OpenSea API requires delays between requests, and the asynchronous nature of triggers. To re-use data, from `backend/src/functions`, run:

```
firebase emulators:start --import test/data/emulatorData --export-on-exit"
```

`--import test/data/emulatorData` pulls in the data at that file. `--export-on-exit` overwrites that file with whatever data you have when you press CTRL+C.

Right now,`emulatorData` on `master` has 32 bufficorns of fighters, users, and players. [2] It has tournaments set up, but no matches are played yet.

Currently, the Goerli chain doesn't update the emulator, so for the tournament to progress you need to manually change the `blockNumber` property on the chains object.

## Re-creating Data

In the case that you need to re-create the data, my suggestions are to:

1. Comment out any code regarding creating images/storing images.
2. Change L3 of `bufficornPlayers.ts` to `for (let i = 0; i < `**`32`**`; i++) {`.
3. Run each step under `yarn test` individually so that all triggers can complete before going to the next step.

For #3, the commands are:

```npx ts-node test/dataSetup.ts; npx ts-node test/simulateFightsTest.ts; npx ts-node test/updateStatsTest.ts; npx ts-node test/seasonTest.ts; npx ts-node test/test.ts; npx ts-node test/firestoreTest.ts; npx ts-node test/tournamentTest.ts```

You can run them all with `yarn test`, but it is likely to time out. Better to run individually.

--- 
[1] As mentioned above, probably better to set the emulator host at beginning of command rather than in bash profile.

[2] It was timing out when creating 128 fighters.

