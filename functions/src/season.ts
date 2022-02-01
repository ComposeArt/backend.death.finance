import _ from 'lodash';
import { ICumulativeStats } from './matches/matches';
import { addCumulativeStats } from './collection';

export const updateCumulativeSeasonStats = async (seasonId: string, db: any) => {
  const seasonPath = db
    .collection('nft-death-games')
    .doc(seasonId);

  try {
    const collections = await seasonPath
      .collection('collections')
      .where('statsDone', '==', true)
      .get();

    const seasonStats: ICumulativeStats = collections
      .map((collection: any) => collection.stats)
      .reduce(addCumulativeStats);

    await seasonPath.update({
      stats: seasonStats,
      updateStats: false,
      statsDone: true
    });
  } catch (error) {
    console.error(error);
    throw new Error(`updateCumulativeSeasonStats failed ${error}`);
  }
};

export const updateFighterRankings = async (seasonId: string, db: any) => {
  const fightersPath = db
    .collection('nft-death-games')
    .doc(seasonId)
    .collection('fighters');

  try {
    const allFighters = await fightersPath.where('statsDone', '==', true).get();
    await Promise.all(allFighters
      .map((fighter: any) => fighter.data())
      .sort(compareFighters)
      .map(async (fighter: any, index: number) => {
        return await fightersPath
          .doc(fighter.id)
          .update({
            ranking: index
          });
      }));
  } catch (error) {
    console.error(error);
    throw new Error(`updateFighterRankings failed ${error}`);
  }
};

export const compareFighters = (fighter1: any, fighter2: any) => {
  const stats1 = fighter1.stats;
  const stats2 = fighter2.stats;

  const wins = stats1.won > stats2.won;
  const kos = stats1.knockedOutOpponent > stats2.knockedOutOpponent;
  const perfects = stats1.perfectedOpponent > stats2.perfectedOpponent;

  // If the lower power fighter has the same # of wins, kos and perfects,
  // they have heart. Rank them higher.
  const power = fighter1.player.power < fighter2.player.power;

  const dmgDealt = stats1.damageDealt > stats2.damageDealt;
  const dmgReceived = stats1.damageReceived < stats2.damageReceived;

  if (
    wins ||
    kos ||
    perfects ||
    power ||
    dmgDealt ||
    dmgReceived) {
    return -1;
  }

  return 0;
};
