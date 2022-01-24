require('dotenv').config();

import _ from 'lodash';
import moment from 'moment';
import { ethers } from 'ethers';
import * as functions from 'firebase-functions';
import nodeHtmlToImage from 'node-html-to-image';

import FightClub from './FightClub.json';

export const simulateFight = async (admin: any, { isSimulated, f1, f2, random, blockNumber }: any, context?: any) => {
  try {
    const db = admin.firestore();
    const storage = admin.storage();

    const fighter1Doc = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('collections')
      .doc(f1.collection)
      .collection('players')
      .doc(f1.id)
      .get();

    const fighter2Doc = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('collections')
      .doc(f2.collection)
      .collection('players')
      .doc(f2.id)
      .get();

    if (fighter1Doc.exists && fighter2Doc.exists) {
      const fighter1 = fighter1Doc.data();
      const fighter2 = fighter2Doc.data();

      const infuraProvider = new ethers.providers.InfuraProvider('goerli', functions.config().infura.id);
      const wallet = new ethers.Wallet(`${functions.config().ethereum.deployer_private_key}`, infuraProvider);
      const signer = wallet.connect(infuraProvider);

      const fightClub = new ethers.Contract(
        '0xEA896aA63f6495f50a26c49749306b28B07E79e0',
        FightClub.abi,
        signer
      );

      let eventLog = await fightClub.fight(isSimulated, fighter1.binary_power, fighter2.binary_power, random, blockNumber);
      eventLog = BigInt((eventLog).toString().replace('.', '')).toString(2);
      const currentBlock = isSimulated ? blockNumber : (await infuraProvider.getBlock(await infuraProvider.getBlockNumber())).number;
      const randomness = isSimulated ? random : (await fightClub.getRandomness()).toString();

      let simulation: any;

      const simulationDocs = await db.collection('nft-death-games').doc('season_0').collection('simulations')
        .where('collection1', '==', fighter1.collection)
        .where('player1', '==', fighter1.id)
        .where('collection2', '==', fighter2.collection)
        .where('player2', '==', fighter2.id)
        .where('block', '==', currentBlock.toString())
        .where('randomness', '==', randomness.toString())
        .get();

      simulationDocs.forEach((simulationDoc: any) => {
        simulation = simulationDoc.id;
      });

      if (!simulation) {
        const bucket = storage.bucket();
        const fileName = `simulations/${fighter1.collection}_${fighter1.token_id}_${fighter2.collection}_${fighter2.token_id}.png`;
        const file = bucket.file(fileName);
        const fileUrl = `https://storage.googleapis.com/composeart-f9a7a.appspot.com/${fileName}`;

        const exists = await file.exists();

        if (!exists[0]) {
          const name1 = `${fighter1.collection} #${_.truncate(fighter1.token_id, { length: 7 })}`;
          const name2 = `${fighter2.collection} #${_.truncate(fighter2.token_id, { length: 7 })}`;

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
                  <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 508px; height: 80px; position: absolute; z-index: 10; left: 0; bottom: 100px;">
                    ${name1}
                  </div>
                  <div style=" font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 508px; height: 80px; position: absolute; z-index: 10; right: 0; bottom: 100px;">
                    ${name2}
                  </div>
                  <div style="background-color: #1A202C; width: 1024px; height: 512px; display: flex; justify-content: center; align-items: center;">
                    <div style="border: 2px solid #1A202C; width: 508px; height: 508px;">
                      <img style="width: 508px; height: 508px; opacity: 0.6;" src="${fighter1.image_url}" />
                    </div>
                    <div style="border: 2px solid #1A202C; width: 508px; height: 508px;">
                      <img style="width: 508px; height: 508px; opacity: 0.6;" src="${fighter2.image_url}" />
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
            collection1: fighter1.collection,
            player1: fighter1.id,
            collection2: fighter2.collection,
            player2: fighter2.id,
            fighter1,
            fighter2,
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
