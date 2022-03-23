import _ from 'lodash';
import fetch from 'node-fetch';
import nodeHtmlToImage from 'node-html-to-image';
import * as functions from 'firebase-functions';

import * as registrationFunctions from './registration';
import * as simulateFunctions from './simulate';
import * as matchesFunctions from './matches/matches';
import * as collectionFunctions from './collection';
import * as seasonFunctions from './season';
import * as tournamentFunctions from './tournament';
import * as tournamentMatchFunctions from './tournamentMatch';
import * as discordFunctions from './discord';
import { emulatorLog } from './utils';

export const createCommand = async (snap: any, admin: any) => {
  const db = admin.firestore();
  const command = snap.data();

  try {
    if (command.type === 'fight') {
      try {
        const result = await simulateFunctions.discordFight({
          db,
          infura: functions.config().infura.id,
          privateKey: functions.config().ethereum.deployer_private_key,
          isSimulated: true,
          token1: command.token1,
          collection1: command.collection1,
          token2: command.token2,
          collection2: command.collection2,
          random: 10,
          blockNumber: 6583056
        });
        await discordFunctions.updateMessage({
          application_id: command.application_id,
          token: command.token,
          content: JSON.stringify(result),
        });
      } catch (error) {
        await discordFunctions.updateMessage({
          application_id: command.application_id,
          token: command.token,
          content: 'fight failed',
        });
      }
    }

    if (command.type === 'refresh') {
      const collectionDoc = await db.collection('collections').doc(command.collection).get();

      let content = '';

      if (collectionDoc.exists) {
        content = `refresh for ${command.collection} complete`;
      } else {
        content = `${command.collection} is not a valid collection!`;
      }

      await discordFunctions.updateMessage({
        application_id: command.application_id,
        token: command.token,
        content,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export const updateCommand = async (change: any, admin: any) => {
  const db = admin.firestore();
  const oldCommand = change.before.data();
  const command = change.after.data();

  // try {

  // } catch (error) {
  //   console.error(error);
  // }
};

export const createMatch = async (snap: any, admin: any) => {
  const db = admin.firestore();
  const match = snap.data();

  try {
    await db.collection('nft-death-games').doc('season_0').collection('matches').doc(match.id).update({
      updateImage: true,
    });
  } catch (error) {
    console.error(error);
  }
};

export const createFighter = async (snap: any, admin: any) => {
  const db = admin.firestore();
  const fighter = snap.data();

  try {
    if (!fighter.is_invalid && !fighter.is_doping) {
      await db.collection('nft-death-games').doc('season_0').collection('fighters').doc(fighter.id).update({
        updateImage: true,
        updateMatches: true,
      });

      await db.collection('nft-death-games').doc('season_0').collection('users').doc(fighter.owner).update({
        updateProfileImage: true,
      });

      await db.collection('nft-death-games').doc('season_0').collection('collections').doc(fighter.collection).update({
        updateCollectionImage: true,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export const updateMatch = async (change: any, admin: any) => {
  const db = admin.firestore();
  const storage = admin.storage();

  const oldMatch = change.before.data();
  const match = change.after.data();

  try {
    if (!oldMatch.updateImage && match.updateImage) {
      await updateMatchImage(db, storage, match);
    }

    if (!oldMatch.simulate && match.simulate) {
      const fightResult = await simulateFunctions.getFightSimulationResults({
        db,
        p1: match.player1,
        p2: match.player2,
        blockNumber: match.block,
      });

      emulatorLog(`Received fight results for ${match.player1.id} and ${match.player2.id}.`);

      await simulateFunctions.saveFightResultsToMatch(
        db,
        match.id,
        fightResult.eventLog,
        fightResult.randomness
      );
    }

    if (!oldMatch.updateStats && match.updateStats) {
      await matchesFunctions.updateFighterStatsForMatch(db, match);
    }
  } catch (error) {
    console.error(error);
  }
};

export const updateFighter = async (change: any, admin: any) => {
  const db = admin.firestore();
  const storage = admin.storage();

  const oldFighter = change.before.data();
  const fighter = change.after.data();

  try {
    if (!oldFighter.updateMatches && fighter.updateMatches) {
      emulatorLog(`Scheduling pre-season matches for fighter ${fighter.id}.`);
      await registrationFunctions.schedulePreSeasonMatches(db, fighter);
    }

    if (!oldFighter.updateImage && fighter.updateImage) {
      await updateFighterImage(db, storage, fighter);
    }

    if (!oldFighter.updateStats && fighter.updateStats) {
      emulatorLog(`Updating stats for fighter ${fighter.id}.`);
      await updateFighterStats(db, fighter);
    }
  } catch (error) {
    console.error(error);
  }
};

export const updateUser = async (change: any, admin: any) => {
  const db = admin.firestore();
  const storage = admin.storage();

  const oldUser = change.before.data();
  const user = change.after.data();

  try {
    if (!oldUser.updateProfileImage && user.updateProfileImage) {
      await updateProfileImage(db, storage, user);
    }

    if (!oldUser.updateChaos && user.updateChaos) {
      await updateChaos(db, user);
    }
  } catch (error) {
    console.error(error);
  }
};

const updateChaos = async (db: any, user: any) => {
  const fightClub = await simulateFunctions.getFightClubContract(db);
  const chaosAdded = (await fightClub.getUserRandomness(user.address)).toString() || '0';

  console.log(chaosAdded);

  await db.collection('nft-death-games').doc('season_0').collection('users').doc(user.address).update({
    chaos: parseInt(chaosAdded, 10),
    updateChaos: false,
  });
};

const updateProfileImage = async (db: any, storage: any, user: any) => {
  const fighterDocs = await db.collection('nft-death-games')
    .doc('season_0')
    .collection('fighters')
    .where('owner', '==', user.address)
    .orderBy('timestamp', 'desc')
    .limit(4)
    .get();

  const players: any = [];

  fighterDocs.forEach((fighterDoc: any) => {
    players.push(fighterDoc.data().player);
  });

  let image = null;
  const bucket = storage.bucket();
  const fileName = `profiles/${user.address}.png`;
  const file = bucket.file(fileName);

  if (players.length === 1) {
    image = await nodeHtmlToImage({
      html: `
        <html>
          <head>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono">
          </head>
          <body style="width: 1024px; height: 512px;">
            <div style="background-color: #1A202C; width: 1024px; height: 512px; display: flex; justify-content: center; align-items: center;">
              <div style="width: 512px; height: 512px;">
                <img style="width: 512px; height: 512px; opacity: 0.6;" src="${players[0].image_url}" />
              </div>
              <div style="width: 512px; height: 512px;">
                <img style="width: 256px; height: 256px; position: absolute; top: 100px; right: 128px;" src="https://death.finance/fight-club-logo-light.png" />
                <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 512px; height: 80px; position: absolute; z-index: 10; left: 512px; bottom: 100px;">
                  death.finance
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    });

    await file.save(image, { contentType: 'image/png' });
    await file.makePublic();
  } else if (players.length === 4) {
    image = await nodeHtmlToImage({
      html: `
        <html>
          <head>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono">
          </head>
          <body style="width: 1024px; height: 512px;">
            <div style="background-color: #1A202C; width: 1024px; height: 512px; display: flex; justify-content: center; align-items: center;">
              <div width: 256px; height: 512px; display: flex; flex-direction: column;">
                <div style="width: 254px; height: 254px; border: 2px solid #1A202C; ">
                  <img style="width: 254px; height: 254px; opacity: 0.6;" src="${players[0].image_url}" />
                </div>
                <div style="width: 254px; height: 254px; border: 2px solid #1A202C; ">
                  <img style="width: 254px; height: 254px; opacity: 0.6;" src="${players[1].image_url}" />
                </div>
              </div>
              <div width: 256px; height: 512px; display: flex; flex-direction: column;">
                <div style="width: 254px; height: 254px; border: 2px solid #1A202C; ">
                  <img style="width: 254px; height: 254px; opacity: 0.6;" src="${players[2].image_url}" />
                </div>
                <div style="width: 254px; height: 254px; border: 2px solid #1A202C; ">
                  <img style="width: 254px; height: 254px; opacity: 0.6;" src="${players[3].image_url}" />
                </div>
              </div>
              <div style="width: 512px; height: 512px;">
                <img style="width: 256px; height: 256px; position: absolute; top: 100px; right: 128px;" src="https://death.finance/fight-club-logo-light.png" />
                <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 512px; height: 80px; position: absolute; z-index: 10; left: 512px; bottom: 100px;">
                  death.finance
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    });

    await file.save(image, { contentType: 'image/png' });
    await file.makePublic();
  }

  await db.collection('nft-death-games').doc('season_0').collection('users').doc(user.address).update({
    updateProfileImage: false
  });
};

const updateCollectionImage = async (db: any, storage: any, collection: any) => {
  const playerDocs = await db.collection('nft-death-games')
    .doc('season_0')
    .collection('collections')
    .doc(collection.id)
    .collection('players')
    .orderBy('power', 'desc')
    .limit(4)
    .get();

  const players: any = [];

  playerDocs.forEach(async (playerDoc: any) => {
    players.push(playerDoc.data());
  });

  let image = null;
  const bucket = storage.bucket();
  const fileName = `collections/${collection.id}.png`;
  const file = bucket.file(fileName);
  const exists = await file.exists();

  if (players.length === 1) {
    image = await nodeHtmlToImage({
      html: `
        <html>
          <head>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono">
          </head>
          <body style="width: 1024px; height: 512px;">
            <div style="background-color: #1A202C; width: 1024px; height: 512px; display: flex; justify-content: center; align-items: center;">
              <div style="width: 512px; height: 512px;">
                <img style="width: 512px; height: 512px; opacity: 0.6;" src="${players[0].image_url}" />
              </div>
              <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 500px; height: 80px; position: absolute; z-index: 10; left: 6px; bottom: 100px;">
                ${collection.id}
              </div>
              <div style="width: 512px; height: 512px;">
                <img style="width: 256px; height: 256px; position: absolute; top: 100px; right: 128px;" src="https://death.finance/fight-club-logo-light.png" />
                <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 512px; height: 80px; position: absolute; z-index: 10; left: 512px; bottom: 100px;">
                  death.finance
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    });

    await file.save(image, { contentType: 'image/png' });
    await file.makePublic();
  } else if (players.length === 4) {
    image = await nodeHtmlToImage({
      html: `
        <html>
          <head>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono">
          </head>
          <body style="width: 1024px; height: 512px;">
            <div style="background-color: #1A202C; width: 1024px; height: 512px; display: flex; justify-content: center; align-items: center;">
              <div width: 256px; height: 512px; display: flex; flex-direction: column;">
                <div style="width: 254px; height: 254px; border: 2px solid #1A202C; ">
                  <img style="width: 254px; height: 254px; opacity: 0.6;" src="${players[0].image_url}" />
                </div>
                <div style="width: 254px; height: 254px; border: 2px solid #1A202C; ">
                  <img style="width: 254px; height: 254px; opacity: 0.6;" src="${players[1].image_url}" />
                </div>
              </div>
              <div width: 256px; height: 512px; display: flex; flex-direction: column;">
                <div style="width: 254px; height: 254px; border: 2px solid #1A202C; ">
                  <img style="width: 254px; height: 254px; opacity: 0.6;" src="${players[2].image_url}" />
                </div>
                <div style="width: 254px; height: 254px; border: 2px solid #1A202C; ">
                  <img style="width: 254px; height: 254px; opacity: 0.6;" src="${players[3].image_url}" />
                </div>
              </div>
              <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 500px; height: 80px; position: absolute; z-index: 10; left: 6px; bottom: 100px;">
                ${collection.id}
              </div>
              <div style="width: 512px; height: 512px;">
                <img style="width: 256px; height: 256px; position: absolute; top: 100px; right: 128px;" src="https://death.finance/fight-club-logo-light.png" />
                <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 512px; height: 80px; position: absolute; z-index: 10; left: 512px; bottom: 100px;">
                  death.finance
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    });

    await file.save(image, { contentType: 'image/png' });
    await file.makePublic();
  }

  await db.collection('nft-death-games').doc('season_0').collection('collections').doc(collection.id).update({
    updateCollectionImage: false
  });
};

const updateMatchImage = async (db: any, storage: any, match: any) => {
  try {
    const bucket = storage.bucket();
    const fileName = `matches/${match.id}.png`;
    const file = bucket.file(fileName);
    const exists = await file.exists();

    if (!exists[0]) {
      const name1 = `${match.player1.collection} #${_.truncate(match.player1.token_id, { length: 7 })}`;
      const name2 = `${match.player2.collection} #${_.truncate(match.player2.token_id, { length: 7 })}`;

      const image = await nodeHtmlToImage({
        html: `
          <html>
            <head>
              <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono">
            </head>
            <body style="width: 1024px; height: 512px;">
              <div style="width: 256px; height: 256px; position: absolute; z-index: 10; left: 384px; top: 128px;">
                <img style="width: 256px; height: 256px;" src="https://death.finance/fight-club-logo-light.png" />
              </div>
              <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 500px; height: 80px; position: absolute; z-index: 10; left: 6px; bottom: 100px;">
                ${name1}
              </div>
              <div style=" font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 500px; height: 80px; position: absolute; z-index: 10; right: 6px; bottom: 100px;">
                ${name2}
              </div>
              <div style="background-color: #1A202C; width: 1024px; height: 512px; display: flex; justify-content: center; align-items: center;">
                <div style="border: 2px solid #1A202C; width: 508px; height: 508px;">
                  <img style="width: 508px; height: 508px; opacity: 0.6;" src="${match.player1.image_url}" />
                </div>
                <div style="border: 2px solid #1A202C; width: 508px; height: 508px;">
                  <img style="width: 508px; height: 508px; opacity: 0.6;" src="${match.player2.image_url}" />
                </div>
              </div>
            </body>
          </html>
        `
      });

      await file.save(image, { contentType: 'image/png' });
      await file.makePublic();
    }

    await db.collection('nft-death-games').doc('season_0').collection('matches').doc(match.id).update({
      updateImage: false
    });
  } catch (error) {
    console.error(error);
  }
};

const updateFighterImage = async (db: any, storage: any, fighter: any) => {
  try {
    if (fighter !== undefined) {
      const player = fighter.player;

      if (player !== undefined) {
        const bucket = storage.bucket();
        const fileName = `fighters/${player.id}.png`;
        const file = bucket.file(fileName);
        const exists = await file.exists();

        if (!exists[0]) {
          const image = await nodeHtmlToImage({
            html: `
              <html>
                <head>
                  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono">
                </head>
                <body style="width: 1024px; height: 512px;">
                  <div style="background-color: #1A202C; width: 1024px; height: 512px; display: flex; justify-content: center; align-items: center;">
                    <div style="width: 512px; height: 512px;">
                      <img style="width: 512px; height: 512px; opacity: 0.6;" src="${player.image_url}" />
                    </div>
                    <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 500px; height: 80px; position: absolute; z-index: 10; left: 6px; bottom: 100px;">
                      ${player.collection} #${_.truncate(player.token_id, { length: 7 })}
                    </div>
                    <div style="width: 512px; height: 512px;">
                      <img style="width: 256px; height: 256px; position: absolute; top: 100px; right: 128px;" src="https://death.finance/fight-club-logo-light.png" />
                      <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 512px; height: 80px; position: absolute; z-index: 10; left: 512px; bottom: 100px;">
                        death.finance
                      </div>
                    </div>
                  </div>
                </body>
              </html>
            `
          });

          await file.save(image, { contentType: 'image/png' });
          await file.makePublic();
        }
      }
    }

    await db.collection('nft-death-games').doc('season_0').collection('fighters').doc(fighter.id).update({
      updateImage: false,
    });

    await logFighterRegistrationToDiscord(db, fighter);

  } catch (error) {
    console.error(error);
  }
};

export const updateFighterStats = async (db: any, fighter: any) => {
  const matchPath = db.collection('nft-death-games')
    .doc('season_0')
    .collection('matches')
    .where('statsDone', '==', true);
  try {
    const fighter1Matches = await matchPath
      .where('fighter1', '==', fighter.id)
      .get();

    const fighter2Matches = await matchPath
      .where('fighter2', '==', fighter.id)
      .get();

    const stats: any = [];
    fighter1Matches.forEach((fighter1Match: any) => {
      stats.push(fighter1Match.data().stats1);
    });

    fighter2Matches.forEach((fighter2Match: any) => {
      stats.push(fighter2Match.data().stats2);
    });

    const cumulativeStats = matchesFunctions.cumulativeStatsFromArray(stats);

    await db
      .collection('nft-death-games')
      .doc('season_0')
      .collection('fighters')
      .doc(fighter.id)
      .update({
        stats: cumulativeStats,
        updateStats: false,
        statsDone: true,
      });

  } catch (error) {
    console.error(error);
    throw new Error(`Failed updating stats for fighter ${fighter.id}`);
  }
};

export const updateBlock = async (change: any, admin: any) => {
  const db = admin.firestore();

  const previous = change.before.data();
  const updatedChain = change.after.data();

  if (previous.blockNumber !== updatedChain.blockNumber) {
    try {
      const newBlockNumber = updatedChain.blockNumber;

      const matchesForBlock = await simulateFunctions.getMatchesForBlock(db, newBlockNumber);

      await Promise.all(matchesForBlock.docs.map(async (match: any) => {
        await db
          .collection('nft-death-games')
          .doc('season_0')
          .collection('matches')
          .doc(match.id)
          .update({
            simulate: true,
          });
      }));

      await tournamentFunctions.runFightsForBlock(db, newBlockNumber);
    } catch (error) {
      console.error(error);
    }
  }
};

export const updateCollection = async (change: any, admin: any) => {
  const previous = change.before.data();
  const updatedCollection = change.after.data();
  const storage = admin.storage();
  const db = admin.firestore();

  try {
    if (!previous.updateCollectionImage && updatedCollection.updateCollectionImage) {
      await updateCollectionImage(db, storage, updatedCollection);
    }

    if (!previous.updateStats && updatedCollection.updateStats) {
      await collectionFunctions.updateCumulativeCollectionStats(updatedCollection, db);
    }
  } catch (error) {
    console.error(error);
  }
};

export const updateSeason = async (change: any, admin: any) => {
  const previous = change.before.data();
  const updatedSeason = change.after.data();
  const db = admin.firestore();

  try {
    if (!previous.updateStats && updatedSeason.updateStats) {
      await seasonFunctions.updateCumulativeSeasonStats(updatedSeason.id, db);
    }

    if (!previous.updateFighterRankings && updatedSeason.updateFighterRankings) {
      await seasonFunctions.updateFighterRankings(updatedSeason.id, db);
    }

    if (!previous.startSeason && updatedSeason.startSeason) {
      await seasonFunctions.startSeason(updatedSeason, db);
    }
  } catch (error) {
    console.error(error);
  }
};

export const updateTournamentMatch = async (change: any, admin: any) => {
  const match = change.after.data();
  const db = admin.firestore();
  await tournamentMatchFunctions.handleUpdatedTournamentMatch(db, match);
};

export const updateFight = async (change: any, admin: any) => {
  const previous = change.before.data();
  const updatedFight = change.after.data();
  const db = admin.firestore();

  try {
    if (!previous.simulate && updatedFight.simulate) {
      const result = await simulateFunctions.getFightSimulationResults({
        db,
        p1: updatedFight.fighter1.player,
        p2: updatedFight.fighter2.player,
        blockNumber: updatedFight.block,
      });
      await db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('fights')
        .doc(updatedFight.id)
        .update({
          log: result.eventLog,
          randomness: result.randomness,
          updateStats: true,
          simulate: false,
        });
    }

    if (!previous.updateStats && updatedFight.updateStats) {
      await tournamentFunctions.updateStatsForFightResult(db, updatedFight);
    }
  } catch (error) {
    console.error(error);
  }
};

const logFighterRegistrationToDiscord = async (db: any, fighter: any) => {
  const ownerDoc = await db.collection('nft-death-games')
    .doc('season_0')
    .collection('users')
    .doc(fighter.owner)
    .get();

  const fighterJson = {
    content: (ownerDoc.exists && 'discord' in ownerDoc.data()) ? `**<@${ownerDoc.data().discord.uid}> just registered a new fighter!**` : '**New fighter registered!**',
    embeds: [
      {
        title: `Power Level: ${fighter.player.power}`,
        color: null,
        fields: [
          {
            name: 'Stats',
            value: `special attack: ${fighter.player.special_attack}\ndefense: ${fighter.player.defense}\nspecial element: ${fighter.player.special_element}`,
            inline: true
          },
          {
            name: '_',
            value: `attack: ${fighter.player.attack}\nhealth: ${fighter.player.health}\nelement: ${fighter.player.element}`,
            inline: true
          }
        ],
        author: {
          name: `${fighter.player.name || `${fighter.player.collection} #${_.truncate(fighter.player.token_id, { length: 7 })}`}`,
          url: `https://${functions.config().app.id === 'deathfinance' ? 'dev.' : ''}death.finance/season/0/fighters/${fighter.id}`
        },
        image: {
          url: `${fighter.player.image_url}`
        }
      }
    ]
  };

  const discordResult = await fetch('https://discord.com/api/webhooks/942251895995645962/OyyQD5Uf5SjFSsPgragmgx9l9Thhcv6JUv9ikd0MiP3SC5qIB4n-Z6QmK_A7mdfRncgE', {
    method: 'POST',
    body: JSON.stringify(fighterJson),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (discordResult.status !== 204) {
    throw new Error(`Request to Discord failed`);
  }
};
