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
  const seasonPath = db
    .collection('nft-death-games')
    .doc(seasonId);

  try {
    const allFighters = await seasonPath.collection('fighters')
      .where('is_doping', '==', false)
      .where('is_invalid', '==', false)
      .where('statsDone', '==', true)
      .get();

    await Promise.all(
      allFighters.docs
        .map((fighter: any) => fighter.data())
        .sort(compareFighters)
        .map(async (fighter: any, index: number) => {
          return await seasonPath
          .collection('fighters')
            .doc(fighter.id)
            .update({
              ranking: index
            });
        }));
    await seasonPath.update({updateFighterRankings: false});
  } catch (error) {
    console.error(error);
    throw new Error(`updateFighterRankings failed ${error}`);
  }
};

export const compareFighters = (fighter1: any, fighter2: any) => {
  const stats1 = fighter1.stats;
  const stats2 = fighter2.stats;

  if (stats1.won > stats2.won) {
    return -1;
  }

  if (stats1.won < stats2.won) {
    return 1;
  }

  if (stats1.knockedOutOpponent > stats2.knockedOutOpponent) {
    return -1;
  }

  if (stats1.knockedOutOpponent < stats2.knockedOutOpponent) {
    return 1;
  }

  if (stats1.perfectedOpponent > stats2.perfectedOpponent) {
    return -1;
  }

  if (stats1.perfectedOpponent < stats2.perfectedOpponent) {
    return 1;
  }

  if (fighter1.player.power < fighter2.player.power) {
    return -1;
  }

  if (fighter1.player.power > fighter2.player.power) {
    return 1;
  }

  if (stats1.damageDealt > stats2.damageDealt) {
    return -1;
  }

  if (stats1.damageDealt < stats2.damageDealt) {
    return 1;
  }

  if (stats1.damageReceived < stats2.damageReceived) {
    return -1;
  }

  if (stats1.damageReceived > stats2.damageReceived) {
    return 1;
  }

  return 0;
};
