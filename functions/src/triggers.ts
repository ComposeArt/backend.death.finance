import _ from 'lodash';
import nodeHtmlToImage from 'node-html-to-image';
import * as registrationFunctions from './registration';
import * as simulateFunctions from './simulate';
import * as matchesFunctions from './matches/matches';
import * as collectionFunctions from './collection';
import * as seasonFunctions from './season';

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

  registrationFunctions.schedulePreSeasonMatches(admin, snap);

  try {
    await db.collection('nft-death-games').doc('season_0').collection('fighters').doc(fighter.id).update({
      updateImage: true,
      updateProfile: true,
      updateCollection: true,
    });
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
    if (!oldFighter.updateImage && fighter.updateImage) {
      await updateFighterImage(db, storage, fighter);
    }

    if (!oldFighter.updateProfile && fighter.updateProfile) {
      await updateProfileImage(db, storage, fighter);
    }

    if (!oldFighter.updateCollection && fighter.updateCollection) {
      await updateCollectionImage(db, storage, fighter);
    }

    if (!oldFighter.updateStats && fighter.updateStats) {
      await updateFighterStats(db, fighter);
    }
  } catch (error) {
    console.error(error);
  }
};

const updateProfileImage = async (db: any, storage: any, fighter: any) => {
  const fighterDocs = await db.collection('nft-death-games')
    .doc('season_0')
    .collection('fighters')
    .where('owner', '==', fighter.owner)
    .limit(4)
    .get();

  let players: any = [];

  fighterDocs.forEach((fighterDoc: any) => {
    if (players.length < 4) {
      players.push(fighterDoc.data().player);
    }
  });

  let image = null;
  const bucket = storage.bucket();
  const fileName = `profiles/${fighter.owner}.png`;
  const file = bucket.file(fileName);
  const exists = await file.exists();

  if (!exists[0]) {
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
    } else {
      if (players.length === 2) {
        players = players.concat([players[1], players[0]]);
      } else if (players.length === 3) {
        players = players.push(players[0]);
      }

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
    }

    await file.save(image, { contentType: 'image/png' });
    await file.makePublic();
  }

  await db.collection('nft-death-games').doc('season_0').collection('fighters').doc(fighter.id).update({
    updateProfile: false
  });
};

const updateCollectionImage = async (db: any, storage: any, fighter: any) => {
  const playerDocs = await db.collection('nft-death-games')
    .doc('season_0')
    .collection('collections')
    .doc(fighter.collection)
    .collection('players')
    .limit(4)
    .get();

  const players: any = [];

  playerDocs.forEach(async (playerDoc: any) => {
    if (players.length < 4) {
      players.push(playerDoc.data());
    }
  });

  let image = null;
  const bucket = storage.bucket();
  const fileName = `collections/${fighter.collection}.png`;
  const file = bucket.file(fileName);
  const exists = await file.exists();

  if (!exists[0]) {
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
              <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 512px; height: 80px; position: absolute; z-index: 10; left: 0; bottom: 100px;">
              ${fighter.collection}
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

  await db.collection('nft-death-games').doc('season_0').collection('fighters').doc(fighter.id).update({
    updateCollection: false
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
            <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 508px; height: 80px; position: absolute; z-index: 10; left: 0; bottom: 100px;">
                ${name1}
            </div>
            <div style=" font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 508px; height: 80px; position: absolute; z-index: 10; right: 0; bottom: 100px;">
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

export const updateFighterImage = async (db: any, storage: any, fighter: any) => {
  try {
    if (fighter !== undefined) {
      fighter = fighter.player;

      if (fighter !== undefined) {
        const bucket = storage.bucket();
        const fileName = `fighters/${fighter.id}.png`;
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
                    <img style="width: 512px; height: 512px; opacity: 0.6;" src="${fighter.image_url}" />
                    </div>
                    <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 512px; height: 80px; position: absolute; z-index: 10; left: 0; bottom: 100px;">
                      ${fighter.collection} #${_.truncate(fighter.token_id, { length: 7 })}
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

    const stats = matchesFunctions
      .totalStatsForMatches(fighter.id, fighter1Matches.concat(fighter2Matches));

    await db
      .collection('nft-death-games')
      .doc('season_0')
      .collection('fighters')
      .doc(fighter.id)
      .update({
        stats,
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

  const newBlockNumber = change.after.data().blockNumber;
  console.log('newBlockNumber received %s', newBlockNumber);
  const matchesForBlock = await simulateFunctions.getMatchesForBlock(db, newBlockNumber);
  const fightResults = await Promise.all(matchesForBlock.docs.map(async (match: any) => {
    return await simulateFunctions.getFightSimulationResults({
      db,
      f1: match.player1,
      f2: match.player2,
      blockNumber: newBlockNumber,
    });
  }));
  console.log('fightResults for block %s: %s', newBlockNumber, fightResults);

  await Promise.all(fightResults.map(async (fightResult: any) => {
    try {
      const saveResult = await simulateFunctions.saveFightResultsToMatch(
        db,
        fightResult.id,
        fightResult.fightLog,
        fightResult.randomness);
      console.log(`saveFightResultsToMatch ${fightResult.id} result: ${saveResult}`);
    } catch (error) {
      console.log(`saveFightResultsToMatch error: ${getErrorMessage(error)}`);
    }
  }));
};

export const updateCollection = async (change: any, db: any) => {
  const previous = change.before.data();
  const updatedCollection = change.after.data();
  try {
    if (!previous.updateStats && updatedCollection.updateStats) {
      await collectionFunctions.updateCumulativeCollectionStats(updatedCollection, db);
    }
  } catch (error) {
    console.error(error);
  }
};

export const updateSeason = async (change: any, db: any) => {
  const previous = change.before.data();
  const updatedSeason = change.after.data();
  try {
    if (!previous.updateStats && updatedSeason.updateStats) {
      await seasonFunctions.updateCumulativeSeasonStats(updatedSeason.id, db);
    }

    if (!previous.updateFighterRankings && updatedSeason.updateFighterRankings) {
      await seasonFunctions.updateFighterRankings(updatedSeason.id, db);
    }
  } catch (error) {
    console.error(error);
  }
};

const getErrorMessage = (error: unknown) => {
  console.log(error);

  if (error instanceof Error) {
    return error.message;
  }

  return '';
};
