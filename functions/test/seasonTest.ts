require('dotenv').config();

import * as admin from 'firebase-admin';

admin.initializeApp({
  projectId: 'composeart-f9a7a',
});
let db = admin.firestore();

const setupSeason = async () => {
  console.log("setupSeason began.");
  const path = db
    .collection('nft-death-games')
    .doc('season_0');
  try {
    await path.create({id: 'season_0'});
    await path.update({
      updateFighterRankings: true
    });
    console.log(`setupSeason succeeded.`)
  } catch (error) {
    console.error(`setupSeason failed, error: ${error}`);
  }
}

const runTestDataSetup = async () => {
  console.log("--- BEGINNING SEASON TEST ---");
  await setupSeason();
  console.log("--- END SEASON TEST ---\n\n");
}
runTestDataSetup();
