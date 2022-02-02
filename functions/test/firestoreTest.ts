require('dotenv').config();

import * as admin from 'firebase-admin';
import { getFightSimulationResults } from "../src/simulate";

admin.initializeApp({
  projectId: 'composeart-f9a7a',
});
let db = admin.firestore();

const setupGoerliForTest = async () => {
  console.log("setupGoerliForTest began.");
  try {
    await db.collection('chains').doc('goerli').create({
      blockNumber: 3,
      contractAddress: "0xc16e8A86E3834E04AfFADC3bFDFD3FA502190c1B",
      randomness: "84609896496648691675909856943781"
    });
    console.log(`setupGoerliForTest succeeded.`)
  } catch (error) {
    console.error(`setupGoerliForTest error: ${error}`);
  }
}

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
  await setupGoerliForTest();
  await getFightSimulationResultsFxn();
}
runTests();
