import _ from 'lodash';
import { emulatorLog } from './utils';

const tournamentSuccession = new Map<string, string>([
  ['zeta', 'sigma'],
  ['theta', 'sigma'],
  ['sigma', 'omega'],
]);

const seasonPath = (db: any) => {
  return db.collection('nft-death-games').doc('season_0');
};

export const handleUpdatedTournamentMatch = (db: any, match: any) => {
  if (tournamentMatchIsCompleted(match) && match.isFinalMatchForTournament) {
    console.log(`updateFighterStatsForMatch final match complete in tournament ${match.bracketName}, ID ${match.id}.`);
    if (match.bracket === 'omega') {
      // season winner
    } else {
      moveFighterToNextTournamentMatch(db, winnerFromTournamentMatch(match), match);
    }
  }
};

const tournamentMatchIsCompleted = (match: any): boolean => {
  const completed = match.best_of === match.fighter1FightWins + match.fighter2FightWins;
  emulatorLog(`tournamentMatchIsCompleted: ${completed}`);
  return completed;
};

const winnerFromTournamentMatch = (match: any) => {
  const f1Wins = match.fighter1FightWins;
  const f2Wins = match.fighter2FightWins;

  if (f1Wins === f2Wins) {
    throw new Error(`winnerFromMatch fails because fighters have equal number of fight wins.`);
  }
  if (f1Wins > f2Wins) {
    return match.fighter1;
  } else {
    return match.fighter2;
  }
};

// Moves fighter to first round of next tournament.
export const moveFighterToNextTournamentMatch = async (db: any, fighter: any, matchFighterWon: any) => {
  const tournament: string = matchFighterWon.bracket;
  const nextTournament = tournamentSuccession.get(tournament)!;

  let nextSlot = Math.floor(matchFighterWon.slot / 2);

  // sigma is the sweet 16. zeta feeds into the top 8 slots (0 through 7). theta into the bottom 8 slots (8 through 15).
  if (tournament === 'theta') {
    nextSlot += 8;
  }

  const matchId = `0-${nextSlot}`;
  emulatorLog(`moveFighterToNextTournament with fighter ${fighter.id} from match ${matchFighterWon.id} in ${matchFighterWon.bracket} to ${matchId} in ${nextTournament}.`);

  // Taking the slot value from `matchFighterWon` for the upper/lower slot _happens_ to work because we are shifting the slot an even
  // amount. This would only break down if we had a tournamnet with an odd number of slots (possibly in a bye situation).
  await moveFighterToMatch(db, fighter, matchFighterWon, nextTournament, matchId);
};

export const moveFighterToMatch = async (
  db: any,
  fighter: any,
  matchFighterWon: any,
  tournament: string,
  newMatchId: string) => {
  const matchPath = seasonPath(db)
    .collection('tournament')
    .doc(tournament)
    .collection('matches')
    .doc(newMatchId);

  try {
    const newMatchSnap = await matchPath.get();
    const newMatch = newMatchSnap.data();

    /* We retain above/below ordering for visual continuity in a bracket. For example:
    a _
       \
        b
    b _/

    c _
       \
        d
    d _/
    For the next round, we always want the winner of c-d to be slotted into player2, and winner of a-b into player1.
    */

    const upperSlot = matchFighterWon.slot % 2 === 0;
    // Assign fighter object to new match.
    if (upperSlot) {
      await matchPath.update({
        fighter1: fighter
      });
    } else {
      await matchPath.update({
        fighter2: fighter
      });
    }

    // Assign fighter object to new fights.
    for (let i = 0; i < newMatch.best_of; i++) {
      const fightPath = seasonPath(db)
        .collection('fights')
        .doc(`${tournament}-${newMatchId}-${i}`);

      if (upperSlot) {
        await fightPath
          .update({
            fighter1: fighter
          });
      } else {
        await fightPath
          .update({
            fighter2: fighter
          });
      }
    }
  } catch (error) {
    console.error(`moveFighterToNextTournament failed with error ${error}`);
  }
};
