require('dotenv').config();

import _ from 'lodash';
import moment from 'moment';
import { ethers } from 'ethers';
import * as functions from 'firebase-functions';

import * as Games from './games';
import FightClub from './FightClub.json';

export const simulateFight = async (admin: any, { isSimulated, fighterOneStats, fighterTwoStats, random, blockNumber }: any, context?: any) => {
  try {
    const infuraProvider = new ethers.providers.InfuraProvider('goerli', functions.config().infura.id);
    const wallet = new ethers.Wallet(`${functions.config().ethereum.deployer_private_key}`, infuraProvider);
    const signer = wallet.connect(infuraProvider);

    const fightClub = new ethers.Contract(
      '0x33a0c80a56af8156C40b987721fC9898785a0cCd',
      FightClub.abi,
      signer
    );

    let eventLog = await fightClub.fight(isSimulated, fighterOneStats, fighterTwoStats, random, blockNumber);
    eventLog = BigInt((eventLog).toString().replace('.', '')).toString(2);
    const currentBlock = isSimulated ? blockNumber : (await infuraProvider.getBlock(await infuraProvider.getBlockNumber())).number;
    const randomness = isSimulated ? random : (await fightClub.getRandomness()).toString();

    return {
      eventLog,
      blockNumber: currentBlock,
      randomness
    };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('failed-precondition', 'simulation failed');
  }
};
