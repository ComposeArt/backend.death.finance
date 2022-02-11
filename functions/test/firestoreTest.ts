require('dotenv').config();

import * as admin from 'firebase-admin';
import { getFightSimulationResults } from "../src/simulate";

admin.initializeApp({
  projectId: 'composeart-f9a7a',
});
let db = admin.firestore();

const getFightSimulation = async () => {
  console.log("getFightSimulation began.");
  const _result = await getFightSimulationResults({
    db,
    p1: {
      collection: 'minitaurs-reborn',
      id: '182521675',
      binary_power: 16498618
    },
    p2: {
      collection: 'galaktic-gang',
      id: '150340670',
      binary_power: 16498619
    },
    blockNumber: '6361936'
  }).catch((error) => {
    console.error("getFightSimulation failed with error: %s", error);
  });
  console.log("getFightSimulation succeded.");
};

const runTests = async () => {
  console.log("--- BEGINNING FIRESTORETEST ---");
  await getFightSimulation();
  console.log("--- END FIRESTORETEST ---\n\n");
}
runTests();
