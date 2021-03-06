import * as functions from 'firebase-functions';
import _ from 'lodash';
import { delay } from './utils';
import { ethers } from 'ethers';

import FightClub from './FightClub.json';

export const updateGoerli = async (admin: any) => {
  try {
    const times = _.times(12, String);

    for (const t of times) {
      const db = admin.firestore();
      const contractAddress = functions.config().app.contract_address;

      const infuraProvider = new ethers.providers.InfuraProvider('goerli', functions.config().infura.id);
      const wallet = new ethers.Wallet(`${functions.config().ethereum.deployer_private_key}`, infuraProvider);
      const signer = wallet.connect(infuraProvider);

      const fightClub = new ethers.Contract(
        contractAddress,
        FightClub.abi,
        signer
      );

      const blockNumber = (await infuraProvider.getBlock(await infuraProvider.getBlockNumber())).number;
      const randomness = (await fightClub.getRandomness()).toString();

      await db.collection('chains').doc('goerli')
        .update({
          contractAddress,
          randomness,
          blockNumber: String(blockNumber)
        });

      await delay(5000);
    }
  } catch (error) {
    console.error(error);
  }
};

export const updateCollectionStats = async (admin: any) => {
  try {
    const db = admin.firestore();

    const collectionDocs = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('collections')
      .get();

    const collections: any = [];

    collectionDocs.forEach((collectionDoc: any) => collections.push(collectionDoc.id));

    await Promise.all(collections.map(async (id: string) => {
      await db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('collections')
        .doc(id)
        .update({
          updateStats: true,
        });
    }));
  } catch (error) {
    console.error(error);
  }
};

export const updateSeasonRankings = async (admin: any) => {
  try {
    const db = admin.firestore();

    await db
      .collection('nft-death-games')
      .doc('season_0')
      .update({
        updateFighterRankings: true,
      });
  } catch (error) {
    console.error(error);
  }
};

export const updateChaosAdded = async (admin: any) => {
  try {
    const db = admin.firestore();

    const userDocs = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('users')
      .get();

    const users: any = [];

    userDocs.forEach((userDoc: any) => users.push(userDoc.id));

    await Promise.all(users.map(async (id: string) => {
      await db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('users')
        .doc(id)
        .update({
          updateChaos: true,
        });
    }));
  } catch (error) {
    console.error(error);
  }
};
