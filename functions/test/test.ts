require('dotenv').config();

import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { ICumulativeStats, cumulativeStatsFromArray } from "../src/matches/matches";
import { addCumulativeStats } from "../src/collection";
import { compareFighters } from "../src/season";
import { getPerFighterMatchStats } from "../src/matches/matchesUtils";
import { buildPreFight, discordFight } from "../src/simulate";
import { firebaseConfig } from "firebase-functions";
import admin from 'firebase-admin';
import fetch from 'node-fetch';
import * as discordFunctions from '../src/discord';

const serviceAccountProd = require('../../serviceAccountKey.json');
const runTimeConfig = require('../../.runtimeconfig.json');


const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccountProd),
  databaseURL: 'https://composeart-f9a7a.firebaseio.com',
});

/*
const functions = getFunctions(app);
connectFunctionsEmulator(functions, "localhost", 5001);
const simulateMatchStatsFighter2Fucked = () => {
  // Copy of match https://death.finance/simulator/2rnmr94SUwk2ymtxN2Jz
  console.log(`simulateMatchStatsPlayer2Fucked began.`);
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
  console.log(`simulateMatchStatsPlayer2Fucked results: ${JSON.stringify(result)}\n`);
};
*/

const simulateMatchStatsTieDyeOnTieDyeViolence = () => {
  // Copy of match https://death.finance/simulator/5FKEqMBjxoBa0GEhnoKv
  console.log(`simulateMatchStatsTieDyeOnTieDyeViolence began.`);
  const fighter1 = {
    attack: 6,
    defense: 10,
    element: 6,
    health: 10,
    id: "44344314",
    power: 53,
    special_attack: 11,
    special_element: 10,
  }

  const fighter2 = {
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
    fighter1,
    fighter2);
  console.log(`simulateMatchStatsTieDyeOnTieDyeViolence results: ${JSON.stringify(result)}\n`);
};

const totalFighterStats = () => {
  console.log(`totalFighterStats began.`);
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

  const result = cumulativeStatsFromArray([match1.stats1, match2.stats1]);
  console.log(`totalFighterStats results: ${JSON.stringify(result)}\n`);
};

const totalCollectionStats = () => {
  const fighter1Stats: ICumulativeStats = {
    matches: 9,
    won: 7,
    knockedOutOpponent: 1,
    perfectedOpponent: 3,
    uninjured: 0,
    untouched: 9,
    pattyCaked: 1,
    boutsFought: 10,
    dodges: 1,
    criticals: 2,
    counterAttacks: 0,
    misses: 2,
    damageDealt: 19,
    damageReceived: 25,
  };

  const fighter2Stats: ICumulativeStats = {
    matches: 9,
    won: 2,
    knockedOutOpponent: 11,
    perfectedOpponent: 3,
    uninjured: 1,
    untouched: 2,
    pattyCaked: 3,
    boutsFought: 7,
    dodges: 0,
    criticals: 1,
    counterAttacks: 2,
    misses: 0,
    damageDealt: 29,
    damageReceived: 14,
  };

  const result = addCumulativeStats(fighter1Stats, fighter2Stats);
  console.log(`totalCollectionStats results: ${JSON.stringify(result)}\n`);
};

const rankFighters = () => {
  const fighter1 = {
    id: 1,
    stats: {
      won: 3,
      knockedOutOpponent: 0,
      perfectedOpponent: 1,
      damageDealt: 19,
      damageReceived: 25,
    },
    player: {
      power: 81
    }
  };

  const fighter2 = {
    id: 2,
    stats: {
      won: 5,
      knockedOutOpponent: 0,
      perfectedOpponent: 1,
      damageDealt: 19,
      damageReceived: 25,
    },
    player: {
      power: 69
    }
  };

  const fighter3 = {
    id: 3,
    stats: {
      won: 5,
      knockedOutOpponent: 0,
      perfectedOpponent: 1,
      damageDealt: 20,
      damageReceived: 25,
    },
    player: {
      power: 68
    }
  };

  const fighter4 = {
    id: 4,
    stats: {
      won: 5,
      knockedOutOpponent: 0,
      perfectedOpponent: 1,
      damageDealt: 20,
      damageReceived: 25,
    },
    player: {
      power: 69
    }
  };

  const fighters = [fighter1, fighter2, fighter3, fighter4];
  const sorted = fighters.sort(compareFighters);
  const ids = sorted.map((fighter) => fighter.id);

  // Order should be fighter3, fighter4, fighter2, fighter1
  console.log(`rankFighters order is now: ${ids}`);
};




const db = admin.firestore();
const fightParams = {
  db,
  infura: runTimeConfig.infura.id,
  privateKey: runTimeConfig.ethereum.deployer_private_key,
  isSimulated: true,
  token1: "3001",
  collection1: "monster-satoshibles",
  token2: "3002",
  collection2: "monster-satoshibles",
  random: 10,
  blockNumber: 6583056
}

const runTests = async () => {
  console.log("--- BEGINNING MAINTEST ---");
  //await simulateMatchStatsFighter2Fucked();
  await simulateMatchStatsTieDyeOnTieDyeViolence();
  await totalFighterStats();
  await totalCollectionStats();
  rankFighters();

  const result = await discordFight(fightParams);
  console.log("\n\n" + JSON.stringify(result) + "\n\n");

  const result2 = await buildPreFight(fightParams);

  console.log(JSON.stringify(result2))
  try {
    const discordResult = await fetch('https://discord.com/api/webhooks/956587116891103264/d_zccFy2aHHI_OhYGURMSosQdq0iwT3toBEPN-pV-4Ms6p4egGpER4nji8jX6qQfYLYf', {
    method: 'POST',
    body: JSON.stringify(result2),
    headers: {
      'Content-Type': 'application/json'
      }
    });
    //console.log("\n\n" + JSON.stringify(discordResult) + "\n\n");
  } catch {
    console.log("\n\nsomethings gone wrong\n\n");
  }
  
  console.log("--- END MAINTEST ---\n\n");
}

runTests();

// Randomness Example
// let userRandomness = await fightClub.getUserRandomness(signer);
// let contractRandomness = await fightClub.getRandomness();
// console.log('userRandomness: ', userRandomness);
// console.log('contractRandomness: ', contractRandomness);
