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
      '0x4B09C49022529EbA8524761d283863adA05861c1',
      FightClub.abi,
      signer
    );

    let eventLog = await fightClub.fight(isSimulated, fighterOneStats, fighterTwoStats, random, blockNumber);
    eventLog = BigInt((eventLog).toString().replace('.', '')).toString(2);

    return eventLog;
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('failed-precondition', 'simulation failed');
  }
};
