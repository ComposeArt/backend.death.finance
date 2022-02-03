require('dotenv').config();

import * as admin from 'firebase-admin';
import * as testData from "./testData";

admin.initializeApp({
  projectId: 'composeart-f9a7a',
});
let db = admin.firestore();

const setupGoerli = async () => {
  console.log("setupGoerli began.");
  try {
    await db.collection('chains').doc('goerli').create({
      blockNumber: 3,
      contractAddress: "0xc16e8A86E3834E04AfFADC3bFDFD3FA502190c1B",
      randomness: "84609896496648691675909856943781"
    });
    console.log(`setupGoerli succeeded.`)
  } catch (error) {
    console.error(`setupGoerli failed, error: ${error}`);
  }
}

const setupCollections = async () => {
  console.log("setupCollections began.");
  try {
    await Promise.all([testData.player1, testData.player2].map(async (player) => {
      return db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('collections')
        .doc(player.collection)
        .collection('players')
        .doc(player.id)
        .create({
          id: player.id,
          isDoping: false,
          isInvalid: false,
        });
    }));
    console.log(`setupCollections succeeded.`)
  } catch (error) {
    console.error(`setupCollections failed, error: ${error}`);
  }
}

const setupFighters = async () => {
  console.log("setupFighters began.");
  try {
    await Promise.all([testData.fighter1, testData.fighter2].map(async (fighter) => {
      return db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('fighters')
        .doc(fighter.id)
        .create({
          id: fighter.id,
          isDoping: false,
          isInvalid: false,
          player: fighter.player
        });
    }));
    console.log(`setupFighters succeeded.`)
  } catch (error) {
    console.error(`setupFighters failed, error: ${error}`);
  }
}

const runTestDataSetup = async () => {
  console.log("--- BEGINNING DATA SETUP ---");
  await setupGoerli();
  await setupCollections();
  await setupFighters();
  console.log("--- END DATA SETUP ---\n\n");
}
runTestDataSetup();
