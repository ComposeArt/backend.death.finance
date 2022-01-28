require('dotenv').config();

import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";

const app = initializeApp({
    apiKey: 'AIzaSyBK-EdRy8HJWm9LiMeLPr-q_kBTfSfTcVY',
    authDomain: 'composeart-f9a7a.firebaseapp.com',
    projectId: 'composeart-f9a7a',
    databaseURL: 'https://composeart-f9a7a.firebaseio.com',
});

const functions = getFunctions(app);
connectFunctionsEmulator(functions, "localhost", 5001);
const simulateFight = httpsCallable(functions, 'simulateFight');
const registerFighter = httpsCallable(functions, 'registerFighter');

const getFightSimulationResultsFxn = async () => {
  const result = await getFightSimulationResults({
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
    blockNumber: 6276992
  }).catch((error) => {
    console.log("simulateFightResults received error %s", getErrorMessage(error));
  });
  console.log("simulateFightResults %s", result);
};

const registerFighterFxn = async () => {
  const result = await registerFighter({
    ownerAddress: '0xe2b9f0757a9e2813fae323aefd89ec8be706104a',
    collection: 'flowtys',
    contract: '0x52607cb9c342821ea41ad265b9bb6a23bea49468',
    token_id: '7910',
    playerId: 56020219
  }).catch((error) => {
    console.log("registerFighterFxn received error %s", getErrorMessage(error));
  });
  console.log("registerFighterFxn result: %s", result);
};

const registerAnotherFighterFxn = async () => {
  const result = await registerFighter({
    ownerAddress: '0xf8a065f287d91d77cd626af38ffa220d9b552a2b',
    collection: 'flowtys',
    contract: '0x52607cb9c342821ea41ad265b9bb6a23bea49468',
    token_id: '2413',
    playerId: 56003240
  }).catch((error) => {
    console.log("registerAnotherFighterFxn received error %s", getErrorMessage(error));
  });
  console.log("registerAnotherFighterFxn result: %s", result);
};

const getErrorMessage = (error: unknown) => {
  console.log(error);

  if (error instanceof Error) {
    return error.message;
  }

  return '';
};

const simulateFightFxn = async () => {

    let response:any = await simulateFight({
        isSimulated: false,
        f1: {
            collection: 'minitaurs-reborn',
            id: '182521675',
        },
        f2: {
            collection: 'galaktic-gang',
            id: '150340670',
        },
        random: '1',
        blockNumber: '1'
    });
    response = response.data;

    let secondaryResponse:any = await simulateFight({
        isSimulated: true,
        f1: {
            collection: 'minitaurs-reborn',
            id: '182521675',
        },
        f2: {
            collection: 'galaktic-gang',
            id: '150340670',
        },
        random: response.randomness.toString(),
        blockNumber: response.blockNumber.toString()
    });

    secondaryResponse = secondaryResponse.data;
    console.log("eventLog replayable?: ", secondaryResponse.eventLog == response.eventLog);

    let eventLog = response.eventLog;
    const EVENT_SIZE = 9;
    let isTie = (eventLog.length % EVENT_SIZE) == 1;
    for(let i = 1; i < eventLog.length - 1; i+=EVENT_SIZE) {
        console.log(`${parseInt(eventLog.substring(i, i+1), 2) == 0 ? "P1 Attack:": "P2 Attack:"} ${parseInt(eventLog.substring(i+1, i+5), 2)}, ${parseInt(eventLog.substring(i, i+1), 2) == 0 ? "P2 Counter:": "P1 Counter:"} ${parseInt(eventLog.substring(i+5, i+EVENT_SIZE), 2)}`);
    }
    console.log(`${isTie ? "TIE!" : parseInt(eventLog.substring(eventLog.length-1, eventLog.length), 2) == 0 ? "Fighter 1 Wins!" : "Fighter 2 Wins!"}`);
}
simulateFightFxn()
registerFighterFxn()
registerAnotherFighterFxn()


// Randomness Example
// let userRandomness = await fightClub.getUserRandomness(signer);
// let contractRandomness = await fightClub.getRandomness();
// console.log('userRandomness: ', userRandomness);
// console.log('contractRandomness: ', contractRandomness);
