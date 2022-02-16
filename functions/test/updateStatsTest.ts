require('dotenv').config();

import * as admin from 'firebase-admin';
import * as testData from "./testData";
import { delay } from '../src/utils';

admin.initializeApp({
  projectId: 'composeart-f9a7a',
});
let db = admin.firestore();

const updateMatchStats = async () => {
  console.log("updateMatchStats began.");
  try {
    const matchesSnap = await db
      .collection('nft-death-games')
      .doc('season_0')
      .collection('matches')
      .get()
    console.log(`updateMatchStats got ${matchesSnap.size} matches.`)
    await Promise.all(matchesSnap.docs.map(async (match) => {
      console.log(`Setting simulate for match ID ${match.id}.`)
      await db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('matches')
        .doc(match.id)
        .update({
          simulate: true
        });
    }));
    console.log(`updateMatchStats succeeded.`)
  } catch (error) {
    console.error(`updateMatchStats failed, error: ${error}`);
  }
}

const updateFighterStats = async () => {
  console.log("updateFighterStats began.");
  try {
    await Promise.all([testData.fighter1, testData.fighter2].map(async (fighter) => {
      return db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('fighters')
        .doc(fighter.id)
        .update({ updateStats: true });
    }));
    console.log(`updateFighterStats succeeded.`)
  } catch (error) {
    console.error(`updateFighterStats failed, error: ${error}`);
  }
}

const runTestDataSetup = async () => {
  console.log("--- BEGINNING UPDATESTATS ---");
  await updateMatchStats();

  // Needed so the triggers in updateMatchStats can complete.
  await delay(5000);
  await updateFighterStats();
  console.log("--- END UPDATESTATS ---\n\n");
}
runTestDataSetup();
