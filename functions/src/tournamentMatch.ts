import _ from 'lodash';

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
  console.log(`tournamentMatchIsCompleted: ${completed}`);
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

export const moveFighterToNextTournamentMatch = async (db: any, fighter: any, matchFighterWon: any) => {
  const bracket: string = matchFighterWon.bracket;
  const nextTournament = tournamentSuccession.get(bracket)!;

  const nextSlot = Math.floor(matchFighterWon.slot / 2);
  const matchId = `0-${nextSlot}`;
  console.log(`moveFighterToNextTournament with fighter ${fighter.id} from match ${matchFighterWon.id} in ${matchFighterWon.bracket} to ${matchId} in ${nextTournament}.`);
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

    const wasUpperSlot = matchFighterWon.slot % 2 === 0;
    // Assign fighter object to new match.
    if (wasUpperSlot) {
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

      if (wasUpperSlot) {
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
