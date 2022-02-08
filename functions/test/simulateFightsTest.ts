require('dotenv').config();

import * as testData from "./testData";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { initializeApp } from "firebase/app";

const app = initializeApp({
  apiKey: 'AIzaSyBK-EdRy8HJWm9LiMeLPr-q_kBTfSfTcVY',
  authDomain: 'composeart-f9a7a.firebaseapp.com',
  projectId: 'composeart-f9a7a',
  databaseURL: 'https://composeart-f9a7a.firebaseio.com',
});

const functions = getFunctions(app);
connectFunctionsEmulator(functions, "localhost", 5001);
const registerFighter = httpsCallable(functions, 'registerFighter');
const simulateFight = httpsCallable(functions, 'simulateFight');

const registerFighterFxn = async () => {
  console.log("registerFighterFxn began.");
  const _result = await registerFighter({
    ownerAddress: testData.fighter1.owner,
    collection: testData.fighter1.collection,
    contract: '0xfa10661c28f309b88aecf14d9ab8f24764d6b10d',
    token_id: testData.player1.tokenId,
    playerId: testData.player1.id
  }).catch((error) => {
    console.log("registerFighterFxn failed, received error %s", getErrorMessage(error));
  });
  console.log("registerFighterFxn succeeded.");
};

const registerAnotherFighterFxn = async () => {
  console.log("registerAnotherFighterFxn began.");
  const _result = await registerFighter({
    ownerAddress: testData.fighter2.owner,
    collection: testData.fighter2.collection,
    contract: '0xf4cd7e65348deb24e30dedee639c4936ae38b763',
    token_id: testData.player2.tokenId,
    playerId: testData.player2.id
  }).catch((error) => {
    console.log("registerAnotherFighterFxn failed, received error %s", getErrorMessage(error));
  });
  console.log("registerAnotherFighterFxn succeeded.");
};

const simulateFightFxn = async () => {
  try {
    let response: any = await simulateFight({
      isSimulated: true,
      player1Id: testData.player1.id,
      player1Collection: testData.player1.collection,
      player2Id: testData.player2.id,
      player2Collection: testData.player2.collection,
      random: '1',
      blockNumber: '11'
    });
    response = response.data;

    let secondaryResponse: any = await simulateFight({
      isSimulated: true,
      player1Id: testData.player1.id,
      player1Collection: testData.player1.collection,
      player2Id: testData.player2.id,
      player2Collection: testData.player2.collection,
      random: response.randomness.toString(),
      blockNumber: response.blockNumber.toString()
    });

    secondaryResponse = secondaryResponse.data;
    console.log("eventLog replayable?: ", secondaryResponse.eventLog == response.eventLog);

    let eventLog = response.eventLog;
    const EVENT_SIZE = 9;
    let isTie = (eventLog.length % EVENT_SIZE) == 1;
    for (let i = 1; i < eventLog.length - 1; i += EVENT_SIZE) {
      console.log(`${parseInt(eventLog.substring(i, i + 1), 2) == 0 ? "P1 Attack:" : "P2 Attack:"} ${parseInt(eventLog.substring(i + 1, i + 5), 2)}, ${parseInt(eventLog.substring(i, i + 1), 2) == 0 ? "P2 Counter:" : "P1 Counter:"} ${parseInt(eventLog.substring(i + 5, i + EVENT_SIZE), 2)}`);
    }
    console.log(`${isTie ? "TIE!" : parseInt(eventLog.substring(eventLog.length - 1, eventLog.length), 2) == 0 ? "Fighter 1 Wins!" : "Fighter 2 Wins!"}`);
  } catch (error) {
    console.error(`simulateFightFxn failed: ${error}`);
  }
}

const getErrorMessage = (error: unknown) => {
  console.log(error);

  if (error instanceof Error) {
    return error.message;
  }

  return '';
};


const runTestDataSetup = async () => {
  console.log("--- BEGINNING DATA SETUP ---");
  await registerFighterFxn();
  await registerAnotherFighterFxn();
  await simulateFightFxn();
  console.log("--- END DATA SETUP ---\n\n");
}
runTestDataSetup();
