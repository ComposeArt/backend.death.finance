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
    throw new Error(`updateCumulativeSeasonStats failed`);
  }
};
