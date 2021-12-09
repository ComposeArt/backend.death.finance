import _ from 'lodash';
import moment from 'moment';

const randomIntFromInterval = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const getPlayers = async ({
  db,
  collection,
  players,
  lastId,
}: any): Promise<any>  => {
  const assetDocs = await db.collection('nft-death-games')
    .doc('season_0')
    .collection('collections')
    .doc(collection)
    .collection('players')
    .where('id', '>', lastId)
    .orderBy('id', 'asc')
    .limit(10000)
    .get();

  assetDocs.forEach((assetDoc: any) => {
    players.push(assetDoc.data());
  });

  if (assetDocs.size < 10000) {
    return players;
  } else {
    return await getPlayers({
      db,
      collection,
      players,
      lastId: players[players.length - 1].id,
    });
  }
};

const duel = ({
  elements,
  p1,
  p2,
  p2Turn,
  bouts,
}: any): any => {
  const p1Stats = _.clone(p1);
  const p2Stats = _.clone(p2);

  if (p1Stats.defense > 0 && p2Stats.defense > 0 && bouts.length < 10) {
    const bout: any = {};

    if (p2Turn) {
      bout.fighter = 'p2';

      if (p1Stats.special_defense > 0) {
        const specialElementStrong = _.indexOf(elements[p2Stats.special_element].strong, p1Stats.special_element) > -1;
        const specialElementWeak = _.indexOf(elements[p1Stats.special_element].strong, p2Stats.special_element) > -1;

        const maxSpecialAttack = specialElementStrong ? Math.min(p2Stats.special_attack * 2, 15) : p2Stats.special_attack;
        const specialAttack = randomIntFromInterval(0, maxSpecialAttack);
        const specialAttackCounter = randomIntFromInterval(0, p1Stats.special_attack);
        const counterAttack = specialElementWeak ? specialAttackCounter - specialAttack : -1;

        bout.is_dodged = specialElementWeak && counterAttack === 0;
        bout.special_attack = specialAttack;

        if (counterAttack > 0) {
          bout.counter_special_attack = counterAttack;
          p2Stats.special_defense = p2Stats.special_defense - counterAttack;
        } else if (!bout.is_dodged) {
          bout.is_critical = specialAttack === maxSpecialAttack;
          p1Stats.special_defense = p1Stats.special_defense - specialAttack;
        }
      } else {
        const elementStrong = _.indexOf(elements[p2Stats.element].strong, p1Stats.element) > -1;
        const elementWeak = _.indexOf(elements[p1Stats.element].strong, p2Stats.element) > -1;

        const maxAttack = elementStrong ? Math.min(p2Stats.attack * 2, 15) : p2Stats.attack;
        const attack = randomIntFromInterval(0, maxAttack);
        const attackCounter = randomIntFromInterval(0, p1Stats.attack);
        const counterAttack = elementWeak ? attackCounter - attack : -1;

        bout.is_dodged = elementWeak && counterAttack === 0;
        bout.attack = attack;

        if (counterAttack > 0) {
          bout.counter_attack = counterAttack;
          p2Stats.defense = p2Stats.defense - counterAttack;
        } else if (!bout.is_dodged) {
          bout.is_critical = attack === maxAttack;
          p1Stats.defense = p1Stats.defense - attack;
        }
      }
    } else {
      bout.fighter = 'p1';

      if (p2Stats.special_defense > 0) {
        const specialElementStrong = _.indexOf(elements[p1Stats.special_element].strong, p2Stats.special_element) > -1;
        const specialElementWeak = _.indexOf(elements[p2Stats.special_element].strong, p1Stats.special_element) > -1;

        const maxSpecialAttack = specialElementStrong ? Math.min(p1Stats.special_attack * 2, 15) : p1Stats.special_attack;
        const specialAttack = randomIntFromInterval(0, maxSpecialAttack);
        const specialAttackCounter = randomIntFromInterval(0, p2Stats.special_attack);
        const counterAttack = specialElementWeak ? specialAttackCounter - specialAttack : -1;

        bout.is_dodged = specialElementWeak && counterAttack === 0;
        bout.special_attack = specialAttack;

        if (counterAttack > 0) {
          bout.counter_special_attack = counterAttack;
          p1Stats.special_defense = p1Stats.special_defense - counterAttack;
        } else if (!bout.is_dodged) {
          bout.is_critical = specialAttack === maxSpecialAttack;
          p2Stats.special_defense = p2Stats.special_defense - specialAttack;
        }
      } else {
        const elementStrong = _.indexOf(elements[p1Stats.element].strong, p2Stats.element) > -1;
        const elementWeak = _.indexOf(elements[p2Stats.element].strong, p1Stats.element) > -1;

        const maxAttack = elementStrong ? Math.min(p1Stats.attack * 2, 15) : p1Stats.attack;
        const attack = randomIntFromInterval(0, maxAttack);
        const attackCounter = randomIntFromInterval(0, p2Stats.attack);
        const counterAttack = elementWeak ? attackCounter - attack : -1;

        bout.is_dodged = elementWeak && counterAttack === 0;
        bout.attack = attack;

        if (counterAttack > 0) {
          bout.counter_attack = counterAttack;
          p1Stats.defense = p1Stats.defense - counterAttack;
        } else if (!bout.is_dodged) {
          bout.is_critical = attack === maxAttack;
          p2Stats.defense = p2Stats.defense - attack;
        }
      }
    }

    bouts.push(bout);

    return duel({
      p1: p1Stats,
      p2: p2Stats,
      p2Turn: bout.is_critical ? p2Turn : !p2Turn,
      bouts,
      elements,
    });
  } else {
    return {
      p1: p1Stats,
      p2: p2Stats,
      winner: p1Stats.defense !== p2Stats.defense ? (p1Stats.defense < p2Stats.defense ? 'p2' : 'p1') : '',
      bouts,
    };
  }
};

export const saveGames = async ({
  db,
  season,
  collection,
  p1,
}: any) => {
  let index = 0;
  let i = 0;
  const batches: any = [];

  const players = await getPlayers({
    db,
    collection,
    players: [],
    lastId: '0',
  });

  console.log(p1.id, 'Fighting', players.length);

  const seasonDoc = await db.collection('nft-death-games')
    .doc(season)
    .get();

  const seasonStats = seasonDoc.data();

  for (const p2 of players) {
    if (p2.id !== p1.id) {
      const result = duel({
        p1,
        p2,
        p2Turn: parseInt(p1.power, 10) > parseInt(p2.power, 10),
        bouts: [],
        elements: seasonStats.elements,
      });

      const gameRef = db.collection('nft-death-games')
        .doc(season)
        .collection('collections')
        .doc(collection)
        .collection('games')
        .doc(`${p1.id}-${p2.id}`);

      const game: any = {
        p1: p1.id,
        p2: p2.id,
        winner: result.winner,
        is_ko: false,
        p1_not_injured: result.p1.defense === p1.defense,
        p2_not_injured: result.p2.defense === p2.defense,
        p1_not_touched: result.p1.special_defense === p1.special_defense,
        p2_not_touched: result.p2.special_defense === p2.special_defense,
        p1_misses: 0,
        p2_misses: 0,
        p1_critical_hits: 0,
        p2_critical_hits: 0,
        p1_dodges: 0,
        p2_dodges: 0,
        p1_counter_attacks: 0,
        p2_counter_attacks: 0,
        p1_max_damage_dealt: 0,
        p2_max_damage_dealt: 0,
        bouts: result.bouts,
      };

      for (const bout of result.bouts) {
        if (bout.fighter === 'p1') {
          if (bout.special_attack > game.p1_max_damage_dealt) {
            game.p1_max_damage_dealt = bout.special_attack;
          }

          if (bout.attack > game.p1_max_damage_dealt) {
            game.p1_max_damage_dealt = bout.attack;
          }

          if (bout.counter_attack > game.p2_max_damage_dealt) {
            game.p2_max_damage_dealt = bout.counter_attack;
          }

          if (bout.special_attack === 0) {
            game.p1_misses++;
          }

          if (bout.attack === 0) {
            game.p1_misses++;
          }

          if (bout.is_critical) {
            game.p1_critical_hits++;
          }

          if (bout.is_dodged) {
            game.p2_dodges++;
          }

          if (bout.counter_attack) {
            game.p2_counter_attacks++;
          }
        }

        if (bout.fighter === 'p2') {
          if (bout.special_attack > game.p2_max_damage_dealt) {
            game.p2_max_damage_dealt = bout.special_attack;
          }

          if (bout.attack > game.p2_max_damage_dealt) {
            game.p2_max_damage_dealt = bout.attack;
          }

          if (bout.counter_attack > game.p1_max_damage_dealt) {
            game.p1_max_damage_dealt = bout.counter_attack;
          }

          if (bout.special_attack === 0) {
            game.p2_misses++;
          }

          if (bout.attack === 0) {
            game.p2_misses++;
          }

          if (bout.is_critical) {
            game.p2_critical_hits++;
          }

          if (bout.is_dodged) {
            game.p1_dodges++;
          }

          if (bout.counter_attack) {
            game.p1_counter_attacks++;
          }
        }
      }

      if (game.winner === 'p1') {
        game.is_ko = result.p2.defense <= 0;
      } else if (game.winner === 'p2') {
        game.is_ko = result.p1.defense <= 0;
      }

      if (i % 500 === 0) {
        const batch = db.batch();

        batch.set(gameRef, game);

        batches.push(batch);

        index = batches.length - 1;
      } else {
        const batch = batches[index];

        batch.set(gameRef, game);
      }

      i++;
    }
  }

  for (const batch of batches) {
    await batch.commit();
  }
};
