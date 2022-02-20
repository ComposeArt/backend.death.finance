import _ from 'lodash';
import { getPerFighterMatchStats } from './matches/matchesUtils';
import { moveFighterToMatch } from './tournamentMatch';
import { emulatorLog } from './utils';

// -- ENTRY POINT --
export const scheduleTournamentsWithStartingBlock = async (
  db: any,
  season: any,
  blockNumber: string
) => {
  const block = increasedToNextFightingBlock(addedNumberToBlock(blockNumber, 10));
  try {
    await scheduleTournamentFirstBrackets(db, block);
    await scheduleTournamentFinalistBrackets(db, block);
  } catch (error) {
    console.error(`scheduleTournamentsWithStartingBlock error ${error}`);
  }
};

// -- END ENTRY POINT --

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

const isFightingBlock = (blockNumber: string): boolean => {
  return _.floor(parseInt(blockNumber, 10) / 10 % 2) === 1;
};

const addedNumberToBlock = (blockNumber: string, numberToAdd: number): string => {
  return (parseInt(blockNumber, 10) + numberToAdd).toString();
};
/*
There are ~6500 blocks every day. We want about 2 hours between rounds, which is 270 blocks.
*/
const twoHoursOfBlocks = 20;
const dayOFBlocks = 60;

export const scheduleTournamentFirstBrackets = async (
  db: any,
  blockNumber: string,
) => {
  const fighters = await getAllFightersRankedOrder(db);
  const { firstHalf, secondHalf } = inHalf(fighters);
  const paired = zip(firstHalf, secondHalf);

  /*
  We want zeta and theta to be as even as possible. Within those tournaments, the best fighters
  should be on opposite ends of the bracket.

  To do that, we build each tournament from the middle outward. In a 16 fighter example:
  8-9 -> theta push -> [8-9]
  7-10 -> zeta push -> [7-10]
  6-11 -> theta unshift -> [6-11, 8-9]
  5-12 -> zeta unshift -> [5-12, 7-10]
  4-13 -> theta push -> [6-11, 8-9, 4-13]
  3-14 -> zeta push -> [5-12, 7-10, 3-14]
  2-15 -> theta unshift -> [2-15, 6-11, 8-9, 4-13]
  1-16 -> zeta unshift -> [1-16, 5-12, 7-10, 3-14]
  */

  const zeta: any[] = [];
  const theta: any[] = [];

  paired.reverse().forEach((matchup, index) => {
    if (index % 2 === 0) {
      if (theta.length % 2 === 0) {
        theta.push(matchup);
      } else {
        theta.unshift(matchup);
      }
    } else {
      if (zeta.length % 2 === 0) {
        zeta.push(matchup);
      } else {
        zeta.unshift(matchup);
      }
    }
  });

  await scheduleFirstRoundBracket(db, 'zeta', 3, zeta, blockNumber);
  await scheduleEmptyBracket(db, 'zeta', 3, zeta.length / 2, addedNumberToBlock(blockNumber, twoHoursOfBlocks), 1, false);
  await scheduleEmptyBracket(db, 'zeta', 3, zeta.length / 4, addedNumberToBlock(blockNumber, twoHoursOfBlocks * 2), 2, true);

  await scheduleFirstRoundBracket(db, 'theta', 3, theta, blockNumber);
  await scheduleEmptyBracket(db, 'theta', 3, theta.length / 2, addedNumberToBlock(blockNumber, twoHoursOfBlocks), 1, false);
  await scheduleEmptyBracket(db, 'theta', 3, theta.length / 4, addedNumberToBlock(blockNumber, twoHoursOfBlocks * 2), 2, true);
};

export const scheduleTournamentFinalistBrackets = async (
  db: any,
  firstRoundBlockStart: string,
) => {
  /*
  We want our finalist rounds, sigma and omega, to start the following day at approximately the same time.
  */
  const sigmaStart = addedNumberToBlock(firstRoundBlockStart, dayOFBlocks);
  const sigmaMatchSize = 8;

  await scheduleEmptyBracket(db, 'sigma', 5, sigmaMatchSize, sigmaStart, 0, false);
  await scheduleEmptyBracket(db, 'sigma', 5, sigmaMatchSize / 2, addedNumberToBlock(sigmaStart, twoHoursOfBlocks), 1, false);
  await scheduleEmptyBracket(db, 'sigma', 5, sigmaMatchSize / 4, addedNumberToBlock(sigmaStart, twoHoursOfBlocks * 2), 2, true);

  await scheduleEmptyBracket(db, 'omega', 7, 1, addedNumberToBlock(sigmaStart, twoHoursOfBlocks * 3), 0, true);
};

const zip = (left: any[], right: any[]): any[] => {
  return left.map((item, i) => {
    return [item, right[i]];
  });
};

const getAllFightersRankedOrder = async (db: any) => {
  const snapshot = await db.collection('nft-death-games')
    .doc('season_0')
    .collection('fighters')
    .where('is_doping', '==', false)
    .where('is_invalid', '==', false)
    .limit(128)
    .orderBy('ranking', 'asc')
    .get();
  return snapshot.docs.map((f: any) => f.data());
};

const inHalf = (array: any[]): any => {
  const midIndex = Math.ceil(array.length / 2);

  const firstHalf = array.slice(0, midIndex);
  const secondHalf = array.slice(-midIndex).reverse();
  return { firstHalf, secondHalf };
};

export const runFightsForBlock = async (
  db: any,
  blockNumber: string,
) => {
  try {
    const fights = await fightsPath(db)
      .where('block', '==', blockNumber)
      .get();
    Promise.all(fights
      .docs
      .map((f: any) => f.data())
      .map(async (fight: any) => {
        emulatorLog(`Running fight ${fight.id} for block ${blockNumber}.`);
        return fightsPath(db)
          .doc(fight.id)
          .update({
            simulate: true
          });
      }));
  } catch (error) {
    console.error(`runFightsForBlock error: ${error}`);
  }
};

export const scheduleEmptyBracket = async (
  db: any,
  bracketName: string,
  bestOfFights: number,
  matchupCount: number,
  blockNumber: string,
  roundNumber: number,
  isFinalMatch: boolean,
) => {
  for (let i = 0; i < matchupCount; i++) {
    const matchupId = `${roundNumber}-${i}`;
    try {
      await tournamentPath(db)
        .doc(bracketName)
        .collection('matches')
        .doc(matchupId)
        .set({
          best_of: bestOfFights,
          bracket: bracketName,
          fighter1FightWins: 0,
          fighter2FightWins: 0,
          id: matchupId,
          round: roundNumber,
          slot: i,
          startingBlock: blockNumber,
          isFinalMatchForTournament: isFinalMatch
        });

      emulatorLog(`Scheduled empty bracket ${bracketName} round ${roundNumber} bracket succeeded.`);
    } catch (error) {
      console.error(`Scheduling empty bracket ${bracketName} round ${roundNumber} failed: ${error}`);
    }

    try {
      await scheduleFightsForTournamentMatchup(db, bracketName, bestOfFights, matchupId, blockNumber);
      emulatorLog(`Scheduling fights for matchup ${bracketName} succeeded.`);
    } catch (error) {
      console.error(`Scheduling empty fights for ${bracketName} round ${roundNumber} failed: ${error}`);
    }
  }
};

export const scheduleFirstRoundBracket = async (
  db: any,
  bracketName: string,
  bestOfFights: number,
  matchups: any[],
  blockNumber: string,
) => {
  await Promise.all(matchups.map(async (matchup: any, index: number) => {
    const [higher, lower] = matchup;
    const matchupId = `0-${index}`;
    try {
      await tournamentPath(db)
        .doc(bracketName)
        .collection('matches')
        .doc(matchupId)
        .set({
          best_of: bestOfFights,
          bracket: bracketName,
          fighter1: higher,
          fighter2: lower,
          fighter1FightWins: 0,
          fighter2FightWins: 0,
          id: matchupId,
          isFinalMatchForTournament: false,
          rank1: higher.ranking,
          rank2: lower.ranking,
          round: 0,
          slot: index,
          startingBlock: blockNumber,
        });

      emulatorLog(`Scheduling ${bracketName} bracket succeeded.`);
    } catch (error) {
      console.error(`Creating tournament ${bracketName} match between ${higher.id} and ${lower.id} failed: ${error}`);
    }

    try {
      await scheduleFightsForTournamentMatchup(db, bracketName, bestOfFights, matchupId, blockNumber, higher, lower);
      emulatorLog(`Scheduling fights for matchup ${bracketName} succeeded.`);
    } catch (error) {
      console.error(`Scheduling fights for ${bracketName} match between ${higher.id} and ${lower.id} failed: ${error}`);
    }
  }));
};

const increasedToNextFightingBlock = (block: string): string => {
  if (!isFightingBlock(block)) {
    return addedNumberToBlock(block, 10).toString();
  }
  return block;
};

export const scheduleFightsForTournamentMatchup = async (
  db: any,
  bracketName: string,
  bestOf: number,
  matchupId: string,
  blockNumber: string,
  fighter1?: any,
  fighter2?: any,
) => {
  try {
    emulatorLog(`scheduleFightsForTournamentMatchup with ${bestOf} rounds.`);
    for (let i = 0; i < bestOf; i++) {
      let fightBlock = addedNumberToBlock(blockNumber, i).toString();
      fightBlock = increasedToNextFightingBlock(fightBlock);

      const id = `${bracketName}-${matchupId}-${i}`;
      const fight: any = {
        block: fightBlock,
        bracket: bracketName,
        id,
        log: '',
        match_id: matchupId,
        simulate: false,
        randomness: '',
      };

      if (fighter1 != null && fighter2 != null) {
        fight.fighter1 = fighter1;
        fight.fighter2 = fighter2;
      }

      fight.isFinalFight = i === (bestOf - 1);

      await db
        .collection('nft-death-games')
        .doc('season_0')
        .collection('fights')
        .doc(id)
        .set(fight);
    }
  } catch (error) {
    console.error(`scheduleFightsForTournamentMatchup error ${error}`);
  }
};

export const updateStatsForFightResult = async (
  db: any,
  fight: any
) => {
  const { stats1, stats2 } = getPerFighterMatchStats(fight.log, fight.fighter1.player, fight.fighter2.player);
  try {
    await seasonPath(db)
      .collection('fights')
      .doc(fight.id)
      .update({
        stats1,
        stats2,
        updateStats: false,
        statsDone: true,
      });

    [fight.fighter1, fight.fighter2].forEach(async (fighter) => {
      await seasonPath(db)
        .collection('fighters')
        .doc(fighter.id)
        .update({
          updateStats: true,
        });
    });

    const matchPath = seasonPath(db).collection('tournament').doc(fight.bracket).collection('matches').doc(fight.match_id);

    const snap = await matchPath.get();
    const match = snap.data();

    const newFighter1Wins = match.fighter1FightWins + (stats1.won ? 1 : 0);
    const newFighter2Wins = match.fighter2FightWins + (stats2.won ? 1 : 0);
    await matchPath.update({
      fighter1FightWins: newFighter1Wins,
      fighter2FightWins: newFighter2Wins
    });

    if (fight.isFinalFight) {
      const fighter1WonMatch = newFighter1Wins > newFighter2Wins;
      moveFighterToNextRoundMatch(db, fighter1WonMatch ? match.fighter1 : match.fighter2, match);
    }
  } catch (error) {
    console.error(`updateStatsForFightResult error ${error}`);
  }
};

const moveFighterToNextRoundMatch = async (db: any, fighter: any, matchFighterWon: any) => {
  if (matchFighterWon.isFinalMatchForTournament) {
    // There is not a new round in this tournament to move to. Returning early,
    // fighter will be scheduled to first round in next tournament elsewhere.
    return;
  }

  const nextRound = matchFighterWon.round + 1;
  const nextSlot = Math.floor(matchFighterWon.slot / 2);

  const matchId = `${nextRound}-${nextSlot}`;
  emulatorLog(`Moving fighter ${fighter.id} to the next round: ${matchId}.`);
  await moveFighterToMatch(db, fighter, matchFighterWon, matchFighterWon.bracket, matchId);
};

const seasonPath = (db: any) => {
  return db.collection('nft-death-games').doc('season_0');
};

const tournamentPath = (db: any) => {
  return seasonPath(db).collection('tournament');
};

const fightsPath = (db: any) => {
  return seasonPath(db).collection('fights');
};
