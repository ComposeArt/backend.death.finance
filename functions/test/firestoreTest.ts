require('dotenv').config();

import * as admin from 'firebase-admin';
import { getFightSimulationResults } from "../src/simulate";

admin.initializeApp({
  projectId: 'composeart-f9a7a',
});
let db = admin.firestore();

const getFightSimulationResultsFxn = async () => {
  console.log("getFightSimulationResultsFxn began.");
  const result = await getFightSimulationResults({
    db,
    f1: {
      collection: 'minitaurs-reborn',
      id: '182521675',
      binary_power: 16498618
    },
    f2: {
      collection: 'galaktic-gang',
      id: '150340670',
      binary_power: 16498619
    },
    blockNumber: 6310879
  }).catch((error) => {
    console.log("getFightSimulationResultsFxn received error %s", error);
  });
  console.log("getFightSimulationResultsFxn %s", result);
};

const runTests = async () => {
  console.log("--- BEGINNING FIRESTORETEST ---");
  await getFightSimulationResultsFxn();
  console.log("--- END FIRESTORETEST ---\n\n");
}
runTests();
