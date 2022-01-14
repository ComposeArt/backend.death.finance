Setup (run in `/functions`)

```
yarn
yarn build
```

For running tests:

Be on node >=v12, if you are below this, install NVM and use this to set an appropriate node version:
```
https://github.com/nvm-sh/nvm
```

Make sure you have firebase cli installed
```
npm install -g firebase-tools
```

Make sure Brennen invites you to the firebase project and then run
```
firebase login
```

Select the project `composeart-f9a7a` and proceed

Now you can run the functions simulator (lucky you):
```
firebase emulators:start
```

And to test, just run the `yarn test` command in `package.json`

Note: `yarn test` hooks up to `functions/test/test.ts`, so, if you want to modify the tests, do it there.

And all the functions are located in `triggers.ts` and they are routed by `index.ts`

Any time you make an update, you'll have to restart the emulator and re-run `yarn build`