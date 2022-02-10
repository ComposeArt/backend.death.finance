require('dotenv').config();

import * as admin from 'firebase-admin';
import * as testData from "./testData";
import { bufficornContract, allBufficorn, allBufficornPlayers } from './data/bufficornPlayers';
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

function delay(d: any) {
  return new Promise((fulfill) => {
    setTimeout(fulfill, d);
  });
}

admin.initializeApp({
  projectId: 'composeart-f9a7a',
});
let db = admin.firestore();

const setupGoerli = async () => {
  console.log("setupGoerli began.");
  try {
    await db.collection('chains').doc('goerli').create({
      blockNumber: "6345212",
      contractAddress: "0x463146588e0c6E6899A9140D9DB488B2354E3775",
      randomness: "84609896496648691675909856943781"
    });
    console.log(`setupGoerli succeeded.`)
  } catch (error) {
    console.error(`setupGoerli failed, error: ${error}`);
  }
}

const allPlayers = [testData.player1, testData.player2, ...allBufficornPlayers()];

const setupCollections = async () => {
  console.log("setupCollections began.");
  try {
    await Promise.all([testData.player1, testData.player2, allBufficorn.bufficorn0].map(async (player) => {
      return db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('collections')
        .doc(player.collection)
        .create({ id: player.collection });
    }));
    console.log(`setupCollections succeeded.`)
  } catch (error) {
    console.error(`setupCollections failed, error: ${error}`);
  }
}
const setupPlayers = async () => {
  console.log("setupPlayers began.");
  try {
    await Promise.all(allPlayers.map(async (player) => {
      return db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('collections')
        .doc(player.collection)
        .collection('players')
        .doc(player.id)
        .create({ ...player });
    }));
    console.log(`setupPlayers succeeded.`)
  } catch (error) {
    console.error(`setupPlayers failed, error: ${error}`);
  }
}

const owners = new Set();
const ownerOfFighter: any = {};

const getUserAddress = async (contract: string, token: string) => {
  try {
    const openSeaResult = await fetch(`https://api.opensea.io/api/v1/asset/${contract}/${token}`, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
        'X-API-KEY': functions.config().opensea.key
      }
    });
    const openSeaData = await openSeaResult.json();
    console.log(`Found owner address: ${openSeaData.owner.address}`);
    return openSeaData.owner.address;
  } catch (error) {
    console.error(`getUserAddress error ${error}`);
  }
};

const setupBufficornUsers = async () => {
  console.log("setupBufficornUsers began.");
  try {
    const players = allBufficornPlayers()

    for (let i = 0; i < players.length; i++) {
      const owner = await getUserAddress(bufficornContract, players[i].token_id);
      const id = players[i].id
      ownerOfFighter[id] = owner
      if (!owners.has(owner)) {
        console.log(`New owner ${owner} for ${id}.`)
        try {
          await db
            .collection('nft-death-games')
            .doc('season_0')
            .collection('users')
            .doc(owner)
            .create({ address: owner });
        } catch (error) {
          console.error(`Error when creating bufficorn user with address ${owner}: ${error}`)
        }
      } else {
        console.log(`Already found have owner ${owner}`)
      }

      // OpenSea blocks us if we send requests too often, so this is added. :(
      await delay(500);
    }
    console.log(`setupBufficornUsers succeeded.`)
  } catch (error) {
    console.error(`setupBufficornUsers failed, error: ${error}`);
  }
}

const setupFighters = async () => {
  console.log("setupFighters began.");
  try {
    await Promise.all(allBufficornPlayers().map(async (player) => {
      console.log(`setupFighters ownerOfFighter[id] (${player.id}): ${ownerOfFighter[player.id]}`)
      return db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('fighters')
        .doc(player.id)
        .create({
          collection: player.collection,
          id: player.id,
          is_invalid: false,
          is_doping: false,
          owner: ownerOfFighter[player.id] ?? "",
          player: player,
          statsDone: false,
          updateMatches: false
        });
    }));
    console.log(`setupFighters succeeded.`)
  } catch (error) {
    console.error(`setupFighters failed, error: ${error}`);
  }
}

const runTestDataSetup = async () => {
  console.log("--- BEGINNING DATA SETUP ---");
  await setupGoerli();
  await setupCollections();
  await setupPlayers();
  await setupBufficornUsers();
  await setupFighters();
  console.log("--- END DATA SETUP ---\n\n");
}
runTestDataSetup();
