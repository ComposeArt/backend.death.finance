require('dotenv').config();

import * as admin from 'firebase-admin';
import {fighter1, fighter2} from "./testData";

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

const setupFighters = async () => {
  console.log("setupFighters began.");
  try {
    await Promise.all([fighter1, fighter2].map(async (fighter) => {
      return db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('fighters')
        .doc(fighter.id)
        .create({
          id: fighter.id,
          isDoping: false,
          isInvalid: false,
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
  await setupFighters();
  console.log("--- END DATA SETUP ---\n\n");
}
runTestDataSetup();
