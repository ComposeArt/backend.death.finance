require('dotenv').config();

import * as admin from 'firebase-admin';
import { scheduleTournamentForBlock } from '../src/tournament';

admin.initializeApp({
  projectId: 'composeart-f9a7a',
});
let db = admin.firestore();

const setupTournament = async () => {
  console.log("setupTournament began.");
  try {
    await scheduleTournamentForBlock(db, "65550");
    console.log("setupTournament succeeded.");
  } catch (error) {
    console.error(`setupTournament failed, error: ${error}`);
  }
}

const runTestDataSetup = async () => {
  console.log("--- BEGINNING TOURNAMENT TEST ---");
  await setupTournament();
  console.log("--- END TOURNAMENT TEST ---\n\n");
}
runTestDataSetup();
