require('dotenv').config()
import _ from 'lodash';
import moment from 'moment';
import { ethers } from "ethers";

import * as Games from './games';
import FightClub from "./FightClub.json";

export const writeDeathGamesCollectionPlayers = async (admin: any, snap: any, context: any) => {
  const db = admin.firestore();
  const playerBefore = snap.before.data() || {};
  const playerAfter = snap.after.data() || {};

  const season = context.params.season;
  const collection = context.params.collection;
  const playerId = context.params.player;

  if (!playerBefore.simulating && playerAfter.simulating) {
    await Games.saveGames({
      db,
      season,
      collection,
      p1: playerAfter,
    });

    await db.collection('nft-death-games')
      .doc(season)
      .collection('collections')
      .doc(collection)
      .collection('players')
      .doc(playerId)
      .update({
        simulating: false,
        latestSimulation: moment().utc().startOf('day').format('x'),
      });
  }
};

export const simulateFight = async (admin: any, { isSimulated, fighterOneStats, fighterTwoStats, random, blockNumber }: any, context?: any) => {
  try {
    const infuraProvider = new ethers.providers.InfuraProvider("goerli", process.env.INFURA_PROJECT_ID);
    let wallet = new ethers.Wallet(`${process.env.DEPLOYER_PRIVATE_KEY}`, infuraProvider);
    const signer = wallet.connect(infuraProvider);
       
    let fightClub = new ethers.Contract(
      "0xc0BC1D18ad637121224646e112C9d4b6a014Ea63",
      FightClub.abi,
      signer
    );
    
    let eventLog = await fightClub.fight(isSimulated, fighterOneStats, fighterTwoStats, random, blockNumber);
    eventLog = BigInt(ethers.utils.formatEther(eventLog).toString().replace(".", "")).toString(2);
    return eventLog;
    // const current = date ? moment(date, 'YYYY-MM-DD') : moment();

    // const db = admin.firestore();

    // const accountDocs = await db.collection('accounts').where('customer', '==', customer.code).get();

    // const accounts: any = [];

    // if (customer.isDemo) {
    //   for (const acc of customer.accounts) {
    //     const demoDoc = await db.collection('accounts').doc(acc).get();

    //     accounts.push({
    //       id: demoDoc.id,
    //       ...demoDoc.data()
    //     });
    //   }
    // }

    // accountDocs.forEach((accountDoc: any) => {
    //   const account = {
    //     id: accountDoc.id,
    //     ...accountDoc.data()
    //   };

    //   if (_.isEmpty(accountIds) || _.indexOf(accountIds, accountDoc.id) !== -1) {
    //     accounts.push(account);
    //   }
    // });

    // const dayAgo = moment(current).utc().startOf('day').subtract(1, 'days');
    // const weekAgo = moment(current).utc().startOf('day').subtract(7, 'days');
    // const monthAgo = moment(current).utc().startOf('day').subtract(1, 'months');

    // const promises = accounts.map((account: any) => {
    //   if (!account.isDisabled) {
    //     if (account.exchange === 'sfox') {
    //       return SFOX.generateReport(db, account, current, [dayAgo, weekAgo, monthAgo]);
    //     }
    //   }

    //   return Promise.resolve();
    // });

    // const exchangeReports = await Promise.all(promises);

    // const dailyReports: any = [];
    // const weeklyReports: any = [];
    // const monthlyReports: any = [];

    // exchangeReports.forEach((exchangeReport: any) => {
    //   if (exchangeReport) {
    //     const daily = _.find(exchangeReport, (r: any) => moment(r.date).isSame(dayAgo));
    //     const weekly = _.find(exchangeReport, (r: any) => moment(r.date).isSame(weekAgo));
    //     const monthly = _.find(exchangeReport, (r: any) => moment(r.date).isSame(monthAgo));

    //     dailyReports.push(_.omit(daily, ['date']));
    //     weeklyReports.push(_.omit(weekly, ['date']));
    //     monthlyReports.push(_.omit(monthly, ['date']));
    //   }
    // });

    // const dailyReport = await formatReport(db, dailyReports, current, dayAgo);
    // const weeklyReport = await formatReport(db, weeklyReports, current, weekAgo);
    // const monthlyReport = await formatReport(db, monthlyReports, current, monthAgo);

    // if (shouldSave) {
    //   await saveReport(db, dailyReport, customer, 'daily');
    //   await saveReport(db, weeklyReport, customer, 'weekly');
    //   await saveReport(db, monthlyReport, customer, 'monthly');
    // }

    // return {
    //   dailyReport,
    //   weeklyReport,
    //   monthlyReport,
    // };
  } catch (error) {
    console.log(error);
  }
};