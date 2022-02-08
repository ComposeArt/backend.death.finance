import * as functions from 'firebase-functions';
import { ethers } from 'ethers';
import _ from 'lodash';

import FightClub from './FightClub.json';

function delay(d: any) {
  return new Promise ((fulfill) => {
    setTimeout(fulfill, d);
  });
}

export const updateGoerli = async (admin: any) => {
  try {
    const times = _.times(12, String);

    for (const t of times) {
      const db = admin.firestore();
      const contractAddress = '0x463146588e0c6E6899A9140D9DB488B2354E3775';

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
    throw new Error('Export operation failed');
  }
};
