import _ from 'lodash';
import { getPerFighterMatchStats } from './matches/matchesUtils';

// TODO: Will be used to make sure fights are scheduled on correct blocks.
const isFightingBlock = (blockNumber: number): boolean => {
  return _.floor(parseInt(blockNumber.toString(), 10) / 10 % 2) === 1;
};

/*
-- Example 128 Fighter Bracket --
Round of 64 (a, 32 matchups) - zeta   \
                                        total 128 fighters
Round of 64 (b, 32 matchups) - theta  /
Round of 32 (a, 16 matchups) - zeta   \
                                        total 64 fighters
Round of 32 (b, 16 matchups) - theta  /
Round of 16 (a) - zeta   \
                           total 32 fighters
Round of 16 (b) - theta  /
Round of 16 (a + b, combined) - sigma
Round of 8 - sigma
Round of 4 - sigma
Round of 2 (final match) - omega
*/

export const scheduleTournamentForBlock = async (
  db: any,
  blockNumber: string
) => {
  try {
    await scheduleTournamentFirstRound(db, blockNumber);
    await scheduleTournamentRemainingRounds(db, blockNumber);
  } catch (error) {
    console.error(`scheduleTournamentForBlock error ${error}`);
  }
};

export const scheduleTournamentFirstRound = async (
  db: any,
  blockNumber: string,
) => {
  const fighters = await getAllFightersRankedOrder(db);
  const [firstHalf, secondHalf] = inHalf(fighters);
  const paired = zip(firstHalf, secondHalf);
  const [zeta, theta] = inHalf(paired);
  // TODO: The zeta bracket has much more disparity than the theta bracket. Need to fix.
  // TODO: Fights should only be scheduled on fighting blocks.
  scheduleBracket(db, 'zeta', 3, zeta, blockNumber);
  scheduleBracket(db, 'theta', 3, theta, blockNumber);
};

export const scheduleTournamentRemainingRounds = async (
  db: any,
  blockNumber: string,
) => {
  // TODO fill in upcoming rounds, but with no fighters
};

const zip = (left: any[], right: any[]): any[] => {
  return left.map(function(item, i) {
    return [item, right[i]];
  });
};

const getAllFightersRankedOrder = async (db: any) => {
  const snapshot = await db.collection('nft-death-games')
    .doc('season_0')
    .collection('fighters')
    .where('is_doping', '==', false)
    .where('is_invalid', '==', false)
    .orderBy('ranking')
    .get();
  return snapshot.docs.map((f: any) => f.data());
};

const inHalf = (array: any[]): any[] => {
  const midIndex = Math.ceil(array.length / 2);

  const firstHalf = array.slice(0, midIndex);
  const secondHalf = array.slice(-midIndex).reverse();
  return [firstHalf, secondHalf];
};

const tournamentPath = (db: any) => {
  return db.collection('nft-death-games').doc('season_0').collection('tournament');
};

const fightsPath = (db: any) => {
  return db.collection('nft-death-games').doc('season_0').collection('fights');
};

export const runFightsForBlock = async (
  db: any,
  blockNumber: string,
) => {
  try {
    await fightsPath(db)
      .where('block', '==', blockNumber)
      .update({
        simulate: true
      });
  } catch (error) {
    console.error(`runFightsForBlock error: ${error}`);
  }
};

export const scheduleBracket = async (
  db: any,
  name: string,
  bestOfFights: number,
  matchups: any[],
  blockNumber: string,
) => {
  await Promise.all(matchups.map(async (matchup: any, index: number) => {
    const [higher, lower] = matchup;
    const matchupId = `0-${index}`;
    try {
      await tournamentPath(db)
        .doc(name)
        .collection('matches')
        .doc(matchupId)
        .create({
          best_of: bestOfFights,
          bracket: name,
          fighter1: higher,
          fighter2: lower,
          rank1: higher.ranking,
          rank2: lower.ranking,
          round: 0,
          startingBlock: blockNumber,
        });

      console.log(`Scheduling ${name} bracket succeeded.`);
    } catch (error) {
      console.error(`Creating tournament ${name} match between ${higher.id} and ${lower.id} failed: ${error}`);
    }

    try {
      await scheduleFightsForTournamentMatchup(db, higher, lower, name, bestOfFights, matchupId, blockNumber);
      console.log(`Scheduling fights for matchup ${name} succeeded.`);
    } catch (error) {
      console.error(`Scheduling fights for ${name} match between ${higher.id} and ${lower.id} failed: ${error}`);
    }
  }));
};

export const scheduleFightsForTournamentMatchup = async (
  db: any,
  f1: any,
  f2: any,
  bracketName: string,
  bestOf: number,
  matchupId: string,
  blockNumber: string,
) => {
  try {
    console.log(`scheduleFightsForTournamentMatchup with ${bestOf} rounds.`);
    for (let i = 0; i < bestOf; i++) {
      await db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('fights')
        .doc(`${bracketName}-${matchupId}`)
        .create({
          block: blockNumber + i,
          bracket: bracketName,
          log: '',
          match_id: matchupId,
          randomness: '',
          fighter1: f1,
          fighter2: f2
        });
    }
  } catch (error) {
    console.error(`scheduleFightsForTournamentMatchup error ${error}`);
  }
};

export const updateFighterStatsForFight = async (
  db: any,
  fight: any
) => {
  const results = getPerFighterMatchStats(fight.log, fight.player1, fight.player2);
  await db
    .collection('nft-death-games')
    .doc('season_0')
    .collection('fights')
    .doc(fight.id)
    .update({
      stats1: results.stats1,
      stats2: results.stats2,
      updateStats: false,
      statsDone: true,
    });

  await [fight.fighter1, fight.fighter2].forEach(async (fighter) => {
    await db
      .collection('nft-death-games')
      .doc('season_0')
      .collection('fighters')
      .doc(fighter)
      .update({
        updateStats: true,
      });
  });
};
