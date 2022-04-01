require('dotenv').config();

import _ from 'lodash';
import moment from 'moment';
import fetch from 'node-fetch';
import { ethers } from 'ethers';
import * as functions from 'firebase-functions';
import nodeHtmlToImage from 'node-html-to-image';
import FightClub from './FightClub.json';
import { emulatorLog } from './utils';

export const getFightClubContract = async (db: any) => {
  const infuraProvider = new ethers.providers.InfuraProvider('goerli', functions.config().infura.id);
  const wallet = new ethers.Wallet(`${functions.config().ethereum.deployer_private_key}`, infuraProvider);
  const signer = wallet.connect(infuraProvider);

  try {
    const address = functions.config().app.contract_address;
    const fightClub = new ethers.Contract(
      address,
      FightClub.abi,
      signer
    );
    return fightClub;
  } catch (error) {
    console.error(`getFightClubContract error: ${error}`);
    throw new Error(`could not find contract address for chain`);
  }
};

export const getMatchesForBlock = async (db: any, blockNumber: number) => {
  const matches = await db
    .collection('nft-death-games')
    .doc('season_0')
    .collection('matches')
    .where('block', '<=', String(blockNumber))
    .where('log', '==', '')
    .orderBy('block', 'desc')
    .limit(500)
    .get();

  return matches;
};

export const getFightSimulationResults = async ({ db, p1, p2, blockNumber }: any) => {
  emulatorLog(`getFightSimulationResults called for block ${blockNumber} and ${p1.id} + ${p2.id}.`);
  const fightClub = await getFightClubContract(db);
  try {

    const randomness = await fightClub.getRandomness({ blockTag: parseInt(blockNumber, 10) });
    const eventLog = await fightClub.fight(true, p1.binary_power, p2.binary_power, randomness.toString(), blockNumber);

    return {
      eventLog: BigInt((eventLog).toString().replace('.', '')).toString(2),
      randomness: randomness.toString(),
    };
  } catch (error) {
    console.error(`getFightSimulationResults failed with error: ${error}`);
    throw new Error(`getFightSimulationResults failed.`);
  }
};

export const saveFightResultsToMatch = async (db: any, matchId: any, fightLog: any, randomness: string) => {
  emulatorLog(`Saving fight results to match ${matchId}.`);
  await db
    .collection('nft-death-games')
    .doc('season_0')
    .collection('matches')
    .doc(matchId)
    .update({
      log: fightLog,
      randomness,
      updateStats: true,
      simulate: false,
    });

  await logMatchOutcomeToDiscord(db, matchId, fightLog);
};

export const simulateFight = async (
  admin: any,
  { isSimulated,
    player1Id,
    player1Collection,
    player2Id,
    player2Collection,
    random,
    blockNumber
  }: any) => {
  try {
    const db = admin.firestore();
    const storage = admin.storage();

    const player1Doc = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('collections')
      .doc(player1Collection)
      .collection('players')
      .doc(player1Id)
      .get();

    const player2Doc = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('collections')
      .doc(player2Collection)
      .collection('players')
      .doc(player2Id)
      .get();

    if (player1Doc.exists && player2Doc.exists) {
      const player1 = player1Doc.data();
      const player2 = player2Doc.data();

      const infuraProvider = new ethers.providers.InfuraProvider('goerli', functions.config().infura.id);
      const wallet = new ethers.Wallet(`${functions.config().ethereum.deployer_private_key}`, infuraProvider);
      const signer = wallet.connect(infuraProvider);

      const fightClub = new ethers.Contract(
        '0xb66465235eD7b96306CeE64eE84f195209953225',
        FightClub.abi,
        signer
      );

      let eventLog = await fightClub.fight(isSimulated, player1.binary_power, player2.binary_power, random, blockNumber);
      eventLog = BigInt((eventLog).toString().replace('.', '')).toString(2);
      const currentBlock = isSimulated ? blockNumber : (await infuraProvider.getBlock(await infuraProvider.getBlockNumber())).number;
      const randomness = isSimulated ? random : (await fightClub.getRandomness()).toString();

      let simulation: any;

      const simulationDocs = await db.collection('nft-death-games').doc('season_0').collection('simulations')
        .where('collection1', '==', player1.collection)
        .where('player1', '==', player1.id)
        .where('collection2', '==', player2.collection)
        .where('player2', '==', player2.id)
        .where('block', '==', currentBlock.toString())
        .where('randomness', '==', randomness.toString())
        .get();

      simulationDocs.forEach((simulationDoc: any) => {
        simulation = simulationDoc.id;
      });

      if (!simulation) {
        const bucket = storage.bucket();
        const fileName = `simulations/${player1.collection}_${player1.token_id}_${player2.collection}_${player2.token_id}.png`;
        const file = bucket.file(fileName);
        const fileUrl = `https://storage.googleapis.com/${functions.config().app.id}.appspot.com/${fileName}`;

        const exists = await file.exists();

        if (!exists[0]) {
          const name1 = `${player1.collection} #${_.truncate(player1.token_id, { length: 7 })}`;
          const name2 = `${player2.collection} #${_.truncate(player2.token_id, { length: 7 })}`;

          const image = await nodeHtmlToImage({
            html: `
              <html>
                <head>
                  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono">
                </head>
                <body style="width: 1024px; height: 512px;">
                  <div style="width: 256px; height: 256px; position: absolute; z-index: 10; left: 384px; top: 128px;">
                    <img style="width: 256px; height: 256px;" src="https://death.finance/fight-club-logo-light.png" />
                  </div>
                  <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 500px; height: 80px; position: absolute; z-index: 10; left: 6px; bottom: 100px;">
                    ${name1}
                  </div>
                  <div style=" font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 500px; height: 80px; position: absolute; z-index: 10; right: 6px; bottom: 100px;">
                    ${name2}
                  </div>
                  <div style="background-color: #1A202C; width: 1024px; height: 512px; display: flex; justify-content: center; align-items: center;">
                    <div style="border: 2px solid #1A202C; width: 508px; height: 508px;">
                      <img style="width: 508px; height: 508px; opacity: 0.6;" src="${player1.image_url}" />
                    </div>
                    <div style="border: 2px solid #1A202C; width: 508px; height: 508px;">
                      <img style="width: 508px; height: 508px; opacity: 0.6;" src="${player2.image_url}" />
                    </div>
                  </div>
                </body>
              </html>
            `
          });

          await file.save(image, { contentType: 'image/png' });
          await file.makePublic();
        }

        const simulationDoc = await db.collection('nft-death-games').doc('season_0').collection('simulations')
          .add({
            collection1: player1.collection,
            player1: player1.id,
            collection2: player2.collection,
            player2: player2.id,
            fighter1: player1,
            fighter2: player2,
            block: currentBlock.toString(),
            randomness: randomness.toString(),
            timestamp: moment().format('x'),
            match: eventLog,
            image_url: fileUrl,
          });

        simulation = simulationDoc.id;
      }

      return {
        eventLog,
        blockNumber: currentBlock.toString(),
        randomness: randomness.toString(),
        simulation,
      };
    } else {
      throw new Error('invalid fighters');
    }
  } catch (error) {
    const msg = getErrorMessage(error);

    throw new functions.https.HttpsError('internal', msg || 'simulation failed');
  }
};

const getErrorMessage = (error: unknown) => {
  console.log(error);

  if (error instanceof Error) {
    return error.message;
  }

  return '';
};

const logMatchOutcomeToDiscord = async (db: any, matchId: any, fightLog: any) => {
  const matchDoc = await db.collection('nft-death-games')
    .doc('season_0')
    .collection('matches')
    .doc(matchId)
    .get();
  const match = matchDoc.data();

  const owner1Doc = await db.collection('nft-death-games')
    .doc('season_0')
    .collection('users')
    .doc(match.owner1)
    .get();

  const owner2Doc = await db.collection('nft-death-games')
    .doc('season_0')
    .collection('users')
    .doc(match.owner2)
    .get();

  let matchString = '';
  if (owner1Doc.exists && 'discord' in owner1Doc.data()) {
    matchString += `<@${owner1Doc.data().discord.uid}>'s `;
  }
  matchString += `${match.player1.name || `|${match.player1.collection}_#${_.truncate(match.player1.token_id, { length: 7 })}|`}`;
  matchString += fightLog[fightLog.length - 1] === '0' ? ` defeats ` : ` is defeated by `;
  if (owner2Doc.exists && 'discord' in owner2Doc.data()) {
    matchString += `<@${owner2Doc.data().discord.uid}>'s `;
  }
  matchString += `${match.player2.name || `|${match.player2.collection}_#${_.truncate(match.player2.token_id, { length: 7 })}|`}`;
  matchString += ` after ${(fightLog.length - 2) / 9} bouts!`;
  matchString += `\n\nhttps://${functions.config().app.id === 'deathfinance' ? 'dev.' : ''}death.finance/season/0/matches/${matchId}`;

  const discordResult = await fetch('https://discord.com/api/webhooks/941713009364054138/P-Ix4i9io5V4EGYaimOu0fVcRictpqbvHR8QmwK82_0e3qp-s8JbkQY2Flccv_Ksv52B', {
    method: 'POST',
    body: JSON.stringify({
      content: matchString
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (discordResult.status !== 204) {
    throw new Error(`Request to Discord failed`);
  }
};

export interface IFightParams {
  db: any;
  infura: any;
  privateKey: string;
  isSimulated: boolean;
  token1: string;
  collection1: string;
  token2: string;
  collection2: string;
  random: number;
  blockNumber: number;
}

export const discordFight = async (params: IFightParams) => {
  try {

    const {db, infura, privateKey, isSimulated, token1, collection1, token2, collection2, random, blockNumber} = params;
    let player1: any = {};
    let player2: any = {};

    const player1Docs = await db.collection('collections')
      .doc(collection1)
      .collection('players')
      .where('token_id', '==', token1)
      .get();

    player1Docs.forEach((player1Doc: any) => {
      player1 = player1Doc.data();
    });

    const player2Docs = await db.collection('collections')
      .doc(collection2)
      .collection('players')
      .where('token_id', '==', token2)
      .get();

    player2Docs.forEach((player2Doc: any) => {
      player2 = player2Doc.data();
    });

    // testing parse
    console.log(JSON.stringify(player1));

    if (!_.isEmpty(player1) && !_.isEmpty(player2)) {
      const infuraProvider = new ethers.providers.InfuraProvider('goerli', infura);
      const wallet = new ethers.Wallet(`${privateKey}`, infuraProvider);
      const signer = wallet.connect(infuraProvider);

      const fightClub = new ethers.Contract(
        '0xb66465235eD7b96306CeE64eE84f195209953225',
        FightClub.abi,
        signer
      );
      let eventLog = await fightClub.fight(isSimulated, player1.binary_power, player2.binary_power, random, blockNumber);
      eventLog = BigInt((eventLog).toString().replace('.', '')).toString(2);
      const currentBlock = isSimulated ? blockNumber : (await infuraProvider.getBlock(await infuraProvider.getBlockNumber())).number;
      const randomness = isSimulated ? random : (await fightClub.getRandomness()).toString();

      return {
        eventLog,
        blockNumber: currentBlock.toString(),
        randomness: randomness.toString(),
      };
    } else {
      throw new Error('invalid fighters');
    }
  } catch (error) {
    const msg = getErrorMessage(error);

    throw new functions.https.HttpsError('internal', msg || 'simulation failed');
  }
};

export const buildPreFight = async (params: IFightParams) => {
  const {db, infura, privateKey, isSimulated, token1, collection1, token2, collection2, random, blockNumber} = params;
  let player1: any = {};
  let player2: any = {};

  const player1Docs = await db.collection('collections')
    .doc(collection1)
    .collection('players')
    .where('token_id', '==', token1)
    .get();

  player1Docs.forEach((player1Doc: any) => {
    player1 = player1Doc.data();
  });

  const player2Docs = await db.collection('collections')
    .doc(collection2)
    .collection('players')
    .where('token_id', '==', token2)
    .get();

  player2Docs.forEach((player2Doc: any) => {
    player2 = player2Doc.data();
  });

  const attackResult: any = player1.attack > player2.attack ? {outcome: 'win', trait: 'attack'} : {outcome: 'loss', trait: 'attack'};
  const defenseResult: any  = player1.defense > player2.defense ? {outcome: 'win', trait: 'defense'} : {outcome: 'loss', trait: 'defense'};
  const healthResult: any = player1.health > player2.health ? {outcome: 'win', trait: 'health'} : {outcome: 'loss', trait: 'health'};
  const powerResult: any  = player1.power > player2.power ? {outcome: 'win', trait: 'power'} : {outcome: 'loss', trait: 'power'};
  const specialAttackResult: any = player1.special_attack > player2.special_attack ?
  {outcome: 'win', trait: 'special_attack'} : {outcome: 'loss', trait: 'special_attack'};
  const specialElementResult: any = player1.special_element > player2.special_element ?
  {outcome: 'win', trait: 'special_element'} : {outcome: 'loss', trait: 'special_element'};
  let wins = '';
  let losses = '';
  const relevantResults = [attackResult, defenseResult, healthResult, powerResult, specialAttackResult, specialElementResult];

  for (const comparison of relevantResults) {
    if (comparison.outcome === 'win') {
      wins += `${comparison.trait}, `;
    } else {
      losses += `${comparison.trait}, `;
    }
  }

  losses = losses.length === 0 ? losses = 'None' : losses = losses.slice(0, -2);
  wins = wins.length === 0 ? wins = 'None' : wins = wins.slice(0, -2);

  const formatting = '```';

  const result = {
    content: `Fight ${player1.token_id} vs ${player2.token_id} initiated by ${player1.token_id}`,
    embeds: [
      {
        title: player1.token_id,
        color: 5814783,
        fields: [
          {
            name: 'Relative Strengths',
            value: `${formatting}ini\n[${wins}]\n${formatting}`,
          },
          {
            name: 'Relative Weaknesses',
            value: `${formatting}css\n[${losses}]\n${formatting}`,
          }
        ]
      }
    ]
  };

  return result;

};
