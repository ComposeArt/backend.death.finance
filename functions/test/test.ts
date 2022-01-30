require('dotenv').config();

import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { getPerFighterMatchStats, totalStatsForMatches } from "../src/matches/matches";

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

// TODO: Fix reference to admin/db for tests https://github.com/ComposeArt/backend/issues/12
// const getFightSimulationResultsFxn = async () => {
//   const result = await getFightSimulationResults({
//     f1: {
//       collection: 'minitaurs-reborn',
//       id: '182521675',
//       binary_power: 16498618
//     },
//     f2: {
//       collection: 'galaktic-gang',
//       id: '150340670',
//       binary_power: 16498619
//     },
//     blockNumber: 6276992
//   }).catch((error) => {
//     console.log("simulateFightResults received error %s", getErrorMessage(error));
//   });
//   console.log("simulateFightResults %s", result);
// };

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

  let response: any = await simulateFight({
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

  let secondaryResponse: any = await simulateFight({
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
  for (let i = 1; i < eventLog.length - 1; i += EVENT_SIZE) {
    console.log(`${parseInt(eventLog.substring(i, i + 1), 2) == 0 ? "P1 Attack:" : "P2 Attack:"} ${parseInt(eventLog.substring(i + 1, i + 5), 2)}, ${parseInt(eventLog.substring(i, i + 1), 2) == 0 ? "P2 Counter:" : "P1 Counter:"} ${parseInt(eventLog.substring(i + 5, i + EVENT_SIZE), 2)}`);
  }
  console.log(`${isTie ? "TIE!" : parseInt(eventLog.substring(eventLog.length - 1, eventLog.length), 2) == 0 ? "Fighter 1 Wins!" : "Fighter 2 Wins!"}`);
}

const simulateMatchStatsFighter2Fucked = () => {
  // Copy of match https://death.finance/simulator/2rnmr94SUwk2ymtxN2Jz
  const f1 = {
    attack: 9,
    defense: 14,
    element: 0,
    health: 15,
    id: "31035683",
    power: 57,
    special_attack: 15,
    special_element: 4,
  }

  const f2 = {
    attack: 4,
    defense: 5,
    element: 1,
    health: 7,
    id: "179684769",
    power: 25,
    special_attack: 7,
    special_element: 1,
  };

  const result = getPerFighterMatchStats(
    "11000100110111100000010000001001101000010100000",
    f1,
    f2);
  console.log(`simulateMatchStatsPlayer2Fucked results: ${JSON.stringify(result)}`);
};

const simulateMatchStatsTieDyeOnTieDyeViolence = () => {
  // Copy of match https://death.finance/simulator/5FKEqMBjxoBa0GEhnoKv
  const f1 = {
    attack: 6,
    defense: 10,
    element: 6,
    health: 10,
    id: "44344314",
    power: 53,
    special_attack: 11,
    special_element: 10,
  }

  const f2 = {
    attack: 14,
    defense: 15,
    element: 3,
    health: 15,
    id: "44341766",
    power: 74,
    special_attack: 15,
    special_element: 12,
  };

  const result = getPerFighterMatchStats(
    "10011100001101000000011000001000000100101000001100001000101000001110011000010000001010101001",
    f1,
    f2);
  console.log(`simulateMatchStatsTieDyeOnTieDyeViolence results: ${JSON.stringify(result)}`);
};

const totalStats = () => {
  const id = "139776475";
  const match1 = {
    fighter1: id,
    stats1: {
      fighterId: id,
      won: true,
      knockedOutOpponent: false,
      perfectedOpponent: false,
      uninjured: false,
      untouched: false,
      pattyCaked: false,
      boutsFought: 10,
      dodges: 1,
      criticals: 2,
      counterAttacks: 0,
      misses: 2,
      damageDealt: 19,
      damageReceived: 25,
    }
  };

  const match2 = {
    fighter1: id,
    stats1: {
      fighterId: id,
      won: true,
      knockedOutOpponent: true,
      perfectedOpponent: false,
      uninjured: false,
      untouched: false,
      pattyCaked: false,
      boutsFought: 7,
      dodges: 0,
      criticals: 1,
      counterAttacks: 2,
      misses: 0,
      damageDealt: 29,
      damageReceived: 14,
    }
  };

  const result = totalStatsForMatches(id, [match1, match2]);
  console.log(`totalStats results: ${JSON.stringify(result)}`);
};

totalStats();
simulateMatchStatsFighter2Fucked();
simulateMatchStatsTieDyeOnTieDyeViolence();
simulateFightFxn();
registerFighterFxn();
registerAnotherFighterFxn();

// Randomness Example
// let userRandomness = await fightClub.getUserRandomness(signer);
// let contractRandomness = await fightClub.getRandomness();
// console.log('userRandomness: ', userRandomness);
// console.log('contractRandomness: ', contractRandomness);
