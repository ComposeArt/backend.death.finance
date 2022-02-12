require('dotenv').config();

import * as admin from 'firebase-admin';
import { delay } from '../src/utils';
import { scheduleTournamentForBlock } from '../src/tournament';

admin.initializeApp({
  projectId: 'composeart-f9a7a',
});
let db = admin.firestore();

// We run this again in case some of the ranking updates didn't get a chance
// to run due to the quick nature of the tests.
const reUpdateFighterRankings = async () => {
  console.log("reUpdateFighterRankings began.");
  try {
    await db
      .collection('nft-death-games')
      .doc('season_0')
      .update({
        updateFighterRankings: true
      });
    console.log("reUpdateFighterRankings succeeded.");
  } catch (error) {
    console.error(`reUpdateFighterRankings failed, error: ${error}`);
  }
};

const setupTournament = async () => {
  console.log("setupTournament began.");
  try {
    await scheduleTournamentForBlock(db, "6361641");
    console.log("setupTournament succeeded.");
  } catch (error) {
    console.error(`setupTournament failed, error: ${error}`);
  }
}

const runTestDataSetup = async () => {
  console.log("--- BEGINNING TOURNAMENT TEST ---");
  await reUpdateFighterRankings();
  delay(1000);
  await setupTournament();
  console.log("--- END TOURNAMENT TEST ---\n\n");
}
runTestDataSetup();
