import _ from 'lodash';
import { elementStrengths } from './matchesUtils';

interface IFighterMatchStats {
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
export interface ICumulativeFighterStats {
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
export type ICumulativeCollectionStats = ICumulativeFighterStats;

export const totalStatsForMatches = (fighterId: string, matches: any[]): ICumulativeFighterStats => {
  const allMatchStats = matches.map((match) => (match.fighter1 === fighterId) ? match.stats1 : match.stats2);
  return allMatchStats.reduce((cumulativeStats, currentMatchStats) => {
    return {
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
    .set({
      stats1: results.stats1,
      stats2: results.stats2,
      updateStats: false,
      statsDone: true,
    });
};

export const getPerFighterMatchStats = (
  fightLog: any,
  fighter1: any,
  fighter2: any,
): { stats1: IFighterMatchStats, stats2: IFighterMatchStats } => {
  const bouts = fightLog.slice(1, -1).match(/.{1,9}/g);
  const winner = fightLog.slice(-1);

  const p1Stats = _.clone(fighter1);
  const p2Stats = _.clone(fighter2);

  const p1SpecialElementStrong = _.indexOf(elementStrengths[p1Stats.special_element], p2Stats.special_element) > -1;
  const p2SpecialElementStrong = _.indexOf(elementStrengths[p2Stats.special_element], p1Stats.special_element) > -1;

  const p1ElementStrong = _.indexOf(elementStrengths[p1Stats.element], p2Stats.element) > -1;
  const p2ElementStrong = _.indexOf(elementStrengths[p2Stats.element], p1Stats.element) > -1;

  if (p1SpecialElementStrong) {
    p1Stats.special_attack = Math.min(p1Stats.special_attack * 2, 15);
  }

  if (p2SpecialElementStrong) {
    p2Stats.special_attack = Math.min(p2Stats.special_attack * 2, 15);
  }

  if (p1ElementStrong) {
    p1Stats.attack = Math.min(p1Stats.attack * 2, 15);
  }

  if (p2ElementStrong) {
    p2Stats.attack = Math.min(p2Stats.attack * 2, 15);
  }

  const p1StartingHealth = p1Stats.health;
  const p2StartingHealth = p2Stats.health;

  let p1DamageDealt = 0;
  let p2DamageDealt = 0;

  let p1Dodges = 0;
  let p2Dodges = 0;

  let p1Criticals = 0;
  let p2Criticals = 0;

  let p1Counters = 0;
  let p2Counters = 0;

  let p1Misses = 0;
  let p2Misses = 0;

  let p1KnockedOutP2 = false;
  let p2KnockedOutP1 = false;

  for (const bout of bouts) {
    const turn = bout.substring(0, 1);
    const attack = parseInt(bout.substring(1, 5), 2);
    const counterAttack = parseInt(bout.substring(5, 9), 2);

    let type;
    let damage;

    const isPlayerOnesTurn = turn === '0';
    if (isPlayerOnesTurn) {
      if (p2Stats.defense > 0) {
        if (counterAttack > 0 && counterAttack >= attack) {
          if (p1Stats.defense > 0 && counterAttack > attack) {
            p1Stats.defense -= counterAttack - attack;

            damage = counterAttack - attack;
            p2DamageDealt += damage;
            type = 'counter';
            p2Counters += 1;

            if (p1Stats.defense <= 0) {
              // p1 defense broke, now only health
            }
          } else {
            type = 'dodge';
            p1Dodges += 1;
          }
        } else {
          p2Stats.defense -= attack;
          p1DamageDealt += attack;

          if (attack === 0) {
            type = 'misses';
            p1Misses += 1;
          } else {

            if (attack === p1Stats.special_attack) {
              type = 'special-critical';
              p1Criticals += 1;
            } else {
              type = 'special-attack';
            }

            damage = attack;

            if (p2Stats.defense <= 0) {
              // p2 defense broke, now only health
            }
          }
        }
      } else if (p2Stats.health > 0) {
        if (counterAttack > 0 && counterAttack >= attack) {
          if (p2Stats.defense <= 0 && p1Stats.defense <= 0 && counterAttack > attack) {
            p1Stats.health -= counterAttack - attack;

            type = 'counter';
            p2Counters += 1;
            damage = counterAttack - attack;
            p2DamageDealt += damage;

            if (p1Stats.health <= 0) {
              // p1 dead
              p2KnockedOutP1 = true;
            }
          } else {
            type = 'dodge';
            p2Dodges += 1;
          }
        } else {
          p2Stats.health -= attack;
          p1DamageDealt += attack;

          if (attack === 0) {
            type = 'misses';
            p1Misses += 1;
          } else {

            if (attack === p1Stats.attack) {
              type = 'critical';
              p1Criticals += 1;
            } else {
              type = 'attack';
            }

            damage = attack;

            if (p2Stats.health <= 0) {
              // p2 dead
              p1KnockedOutP2 = true;
            }
          }
        }
      }
    } else {
      if (p1Stats.defense > 0) {
        if (counterAttack > 0 && counterAttack >= attack) {
          if (p2Stats.defense > 0 && counterAttack > attack) {
            p2Stats.defense -= counterAttack - attack;

            damage = counterAttack - attack;
            p1DamageDealt += damage;
            type = 'counter';
            p1Counters += 1;

            if (p2Stats.defense <= 0) {
              // p2 defense broke, now only health
            }

          } else {
            type = 'dodge';
            p1Dodges += 1;
          }
        } else {
          p1Stats.defense -= attack;
          p2DamageDealt += attack;

          if (attack === 0) {
            type = 'misses';
            p2Misses += 1;
          } else {

            if (attack === p2Stats.special_attack) {
              type = 'special-critical';
              p2Criticals += 1;
            } else {
              type = 'special-attack';
            }

            damage = attack;

            if (p1Stats.defense <= 0) {
              // p1 defense broke, now only health
            }
          }
        }
      } else if (p1Stats.health > 0) {
        if (counterAttack > 0 && counterAttack >= attack) {
          if (p1Stats.defense <= 0 && p2Stats.defense <= 0 && counterAttack > attack) {
            p2Stats.health -= counterAttack - attack;

            damage = counterAttack - attack;
            p1DamageDealt += damage;
            type = 'counter';
            p1Counters += 1;

            if (p2Stats.health <= 0) {
              // p2 dead
              p1KnockedOutP2 = true;
            }
          } else {
            type = 'dodge';
            p1Dodges += 1;
          }
        } else {
          p1Stats.health -= attack;
          p2DamageDealt += attack;

          if (attack === 0) {
            type = 'misses';
            p2Misses += 1;
          } else {
            if (attack === p2Stats.attack) {
              type = 'critical';
              p2Criticals += 1;
            } else {
              type = 'attack';
            }

            damage = attack;

            if (p1Stats.health <= 0) {
              // p1 dead
              p2KnockedOutP1 = true;
            }
          }
        }
      }
    }
  }

  const fightersPattyCaked = p1DamageDealt === 0 && p2DamageDealt === 0;

  const p1MatchStats: IFighterMatchStats = {
    fighterId: p1Stats.id,
    won: winner === 0,
    knockedOutOpponent: p1KnockedOutP2,
    perfectedOpponent: bouts.length === 2 && p2Stats.health === 0,
    uninjured: p1StartingHealth === p1Stats.health,
    untouched: p2DamageDealt === 0,
    pattyCaked: fightersPattyCaked,
    boutsFought: bouts.length,
    dodges: p1Dodges,
    criticals: p1Criticals,
    counterAttacks: p1Counters,
    misses: p1Misses,
    damageDealt: p1DamageDealt,
    damageReceived: p2DamageDealt
  };

  const p2MatchStats: IFighterMatchStats = {
    fighterId: p2Stats.id,
    won: winner === 1,
    knockedOutOpponent: p2KnockedOutP1,
    perfectedOpponent: bouts.length === 2 && p1Stats.health === 0,
    uninjured: p2StartingHealth === p2Stats.health,
    untouched: p1DamageDealt === 0,
    pattyCaked: fightersPattyCaked,
    boutsFought: bouts.length,
    dodges: p2Dodges,
    criticals: p2Criticals,
    counterAttacks: p2Counters,
    misses: p2Misses,
    damageDealt: p2DamageDealt,
    damageReceived: p1DamageDealt
  };

  return {
    stats1: p1MatchStats,
    stats2: p2MatchStats
  };
};
