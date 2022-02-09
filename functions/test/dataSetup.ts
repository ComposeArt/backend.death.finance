require('dotenv').config();

import * as admin from 'firebase-admin';
import * as testData from "./testData";

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

const setupCollections = async () => {
  console.log("setupCollections began.");
  try {
    await Promise.all([testData.player1, testData.player2].map(async (player) => {
      return db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('collections')
        .doc(player.collection)
        .create({});
    }));
    console.log(`setupCollections succeeded.`)
  } catch (error) {
    console.error(`setupCollections failed, error: ${error}`);
  }
}
const setupPlayers = async () => {
  console.log("setupPlayers began.");
  try {
    await Promise.all([testData.player1, testData.player2].map(async (player) => {
      return db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('collections')
        .doc(player.collection)
        .collection('players')
        .doc(player.id)
        .create({...player});
    }));
    console.log(`setupPlayers succeeded.`)
  } catch (error) {
    console.error(`setupPlayers failed, error: ${error}`);
  }
}

const setupUsers = async () => {
  console.log("setupUsers began.");
  try {
    await Promise.all([testData.user1, testData.user2].map(async (u) => {
      return db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('users')
        .doc(u.address)
        .create({address: u.address});
    }));
    console.log(`setupUsers succeeded.`)
  } catch (error) {
    console.error(`setupUsers failed, error: ${error}`);
  }
}

const setupFighters = async () => {
  console.log("setupFighters began.");
  try {
    await Promise.all([testData.fighter1, testData.fighter2].map(async (fighter) => {
      return db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('fighters')
        .doc(fighter.id)
        .create({...fighter});
    }));
    console.log(`setupFighters succeeded.`)
  } catch (error) {
    console.error(`setupFighters failed, error: ${error}`);
  }
}

const setupSeason = async () => {
  console.log("setupSeason began.");
  const path = db
    .collection('nft-death-games')
    .doc('season_0');
  try {
    await path.create({id: 'season_0'});
    await path.update({
      updateFighterRankings: true
    });
    console.log(`setupSeason succeeded.`)
  } catch (error) {
    console.error(`setupSeason failed, error: ${error}`);
  }
}

const runTestDataSetup = async () => {
  console.log("--- BEGINNING DATA SETUP ---");
  await setupGoerli();
  await setupCollections();
  await setupPlayers();
  await setupUsers();
  await setupFighters();
  await setupSeason();
  console.log("--- END DATA SETUP ---\n\n");
}
runTestDataSetup();
