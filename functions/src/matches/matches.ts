import _ from 'lodash';
import { getPerFighterMatchStats } from './matchesUtils';

export interface IFighterMatchStats {
  fighterId: string;
  won: boolean;
  knockedOutOpponent: boolean;
  perfectedOpponent: boolean;
  uninjured: boolean;
  untouched: boolean;
  pattyCaked: boolean;
  boutsFought: number;
  dodges: number;
  criticals: number;
  counterAttacks: number;
  misses: number;
  damageDealt: number;
  damageReceived: number;
}

// These two interfaces are very similar, just changing `boolean` types to `number` for properties like knockedOutOpponent.
export interface ICumulativeStats {
  matches: number;
  won: number;
  knockedOutOpponent: number;
  perfectedOpponent: number;
  uninjured: number;
  untouched: number;
  pattyCaked: number;
  boutsFought: number;
  dodges: number;
  criticals: number;
  counterAttacks: number;
  misses: number;
  damageDealt: number;
  damageReceived: number;
}

export const cumulativeStatsFromArray = (stats: any[]): ICumulativeStats => {
  return stats.reduce((cumulativeStats, currentMatchStats) => {
    return {
      matches: stats.length,
      won: cumulativeStats.won + currentMatchStats.won,
      knockedOutOpponent: cumulativeStats.knockedOutOpponent + currentMatchStats.knockedOutOpponent,
      perfectedOpponent: cumulativeStats.perfectedOpponent + currentMatchStats.perfectedOpponent,
      uninjured: cumulativeStats.uninjured + currentMatchStats.uninjured,
      untouched: cumulativeStats.untouched + currentMatchStats.untouched,
      pattyCaked: cumulativeStats.pattyCaked + currentMatchStats.pattyCaked,
      boutsFought: cumulativeStats.boutsFought + currentMatchStats.boutsFought,
      dodges: cumulativeStats.dodges + currentMatchStats.dodges,
      criticals: cumulativeStats.criticals + currentMatchStats.criticals,
      counterAttacks: cumulativeStats.counterAttacks + currentMatchStats.counterAttacks,
      misses: cumulativeStats.misses + currentMatchStats.misses,
      damageDealt: cumulativeStats.damageDealt + currentMatchStats.damageDealt,
      damageReceived: cumulativeStats.damageReceived + currentMatchStats.damageReceived,
    };
  });
};

export const updateFighterStatsForMatch = async (
  db: any,
  match: any
) => {
  const results = getPerFighterMatchStats(match.log, match.player1, match.player2);
  await db
    .collection('nft-death-games')
    .doc('season_0')
    .collection('matches')
    .doc(match.id)
    .update({
      stats1: results.stats1,
      stats2: results.stats2,
      updateStats: false,
      statsDone: true,
    });

  await db
    .collection('nft-death-games')
    .doc('season_0')
    .collection('fighters')
    .doc(match.fighter1)
    .update({
      updateStats: true,
    });

  await db
    .collection('nft-death-games')
    .doc('season_0')
    .collection('fighters')
    .doc(match.fighter2)
    .update({
      updateStats: true,
    });
};
