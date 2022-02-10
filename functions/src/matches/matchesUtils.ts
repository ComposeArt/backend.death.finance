import { IFighterMatchStats } from './matches';
import _ from 'lodash';

export const elementStrengths: any = {
  0: [], // non elemental
  1: [3], // earth
  2: [1], // fire
  3: [2], // water
  4: [1, 6], // light
  5: [2, 4], // time
  6: [3, 5], // force
  7: [1, 6, 12], // moon
  8: [1, 4, 7], // flower
  9: [2, 4, 8], // shadow
  10: [2, 5, 9], // ice
  11: [3, 5, 10], // thunder
  12: [3, 6, 11], // wind
};

export const specialAttacks: any = {
  0: [
    'throws a one finger punch',
    'throws a haymaker',
    'karate chops',
    'launches a flying kick',
    'initiates a piledrive',
    'initiates a piledrive of death'
  ],
  1: [
    'throws a sand attack',
    'throws a boulder smash',
    'attacks with a blasting earthspike',
    'summons a sandstorm',
    'summons a terrifying earthquake',
    'summons a once in a century earthquake',
  ],
  2: [
    'attacks with a smack of ash',
    'summons a heatwave',
    'attacks with a flamethrower',
    'sets off a wildfire',
    'calls upon a meteor',
    'calls upon a world ending meteor',
  ],
  3: [
    'squirts a water gun',
    'creates a whirlpool',
    'brings forth a waterfall',
    'throws a mist strike',
    'summons a typhoon',
    'summons a city destroying typhoon',
  ],
  4: [
    'radiates with sunshine',
    'blinds with a blinding light',
    'fires a sunbeam',
    'throws a guiding bolt',
    'initiates a solar eclipse',
    'initiates a final solar eclipse',
  ],
  5: [
    'launches a dilated attack',
    'throws a double strike',
    'forces a self infliction',
    'forces a time lapse trip',
    'starts a multiversal destruction',
    'starts a cross-multiversal destruction',
  ],
  6: [
    'produces a sound blast',
    'launches a throwback attack',
    'initiates a gravity charge',
    'summons a planet fall',
    'starts a super nova',
    'starts a delta omega super nova',
  ],
  7: [
    'begins to wolf howl',
    'launches a nightlight attack',
    'attacks with a lunar blast',
    'summons a star fall',
    'calls upon a crashing aurora borealis',
    'calls upon a hellish aurora borealis',
  ],
  8: [
    'fires a bullet seed',
    'tosses some poison gas',
    'attacks with a toxic bite',
    'initiates a carbon breakdown',
    'calls upon a cloud of acid rain',
    'calls upon a never ending cloud of acid rain',
  ],
  9: [
    'weirdly starts licking',
    'is having a nightmare',
    'starts to eat dreams',
    'initiates requiem',
    'summons a lunar eclipse',
    'summons a titan lunar eclipse',
  ],
  10: [
    'throws a snowball',
    'fires a frost bullet',
    'creates a giant avalanche',
    'summons a blizzard',
    'initiates a quick ice age',
    'starts a forever ice age',
  ],
  11: [
    'sparks a static shock',
    'launches a zap attack',
    'throws a thunderbolt',
    'sets up a lightning trap',
    'turns on tesla\'s enigma',
    'runs over with a cybertruck of tesla\'s enigma',
  ],
  12: [
    'attacks with fury swipes',
    'launches a nimbus strike',
    'kicks up a whirlwind',
    'summons a tornado',
    'summons a hurricane',
    'summons a country ripping hurricane',
  ],
};

export const attacks: any = {
  0: [
    'throws a slap',
    'throws a punch',
    'launches a kick',
    'attacks with a headbutt',
  ],
  1: [
    'throws a mud slap',
    'throws a rock punch',
    'launches a hot iron kick',
    'attacks with a steel headbutt',
  ],
  2: [
    'throws a single ember slap',
    'throws a spark punch',
    'launches a flame kick',
    'attacks with a fire headbutt',
  ],
  3: [
    'throws a bubble slap',
    'throws a hydro punch',
    'launches a torrent kick',
    'attacks with a tsunami headbutt',
  ],
  4: [
    'throws a beam slap',
    'throws a sunshine punch',
    'launches a blinding kick',
    'attacks with a solar headbutt',
  ],
  5: [
    'throws a double slap',
    'throws a self punch',
    'launches repeated kicks',
    'attacks with a single infinite headbutt',
  ],
  6: [
    'throws a backhand slap',
    'throws a pulse punch',
    'launches a gravity kick',
    'attacks with a quantum headbutt',
  ],
  7: [
    'throws a crescent moon slap',
    'throws a full moon punch',
    'launches a new moon kick',
    'attacks with a titan headbutt',
  ],
  8: [
    'throws a seed slap',
    'throws a root punch',
    'launches a thorn kick',
    'attacks with a spore headbutt',
  ],
  9: [
    'throws a shadow slap',
    'throws a dark punch',
    'launches a secret kick',
    'attacks with a headless headbutt',
  ],
  10: [
    'throws a frost slap',
    'throws a quick ice punch',
    'launches a cryo kick',
    'attacks with a frozen headbutt'
  ],
  11: [
    'throws a jolt slap',
    'throws a thunder punch',
    'launches a lightning kick',
    'attacks with a flash headbutt',
  ],
  12: [
    'throws a windy slap',
    'throws a gust punch',
    'launches a whirlwind kick',
    'attacks with a breakneck headbutt',
  ],
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
    won: winner === '0',
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
    won: winner === '1',
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
