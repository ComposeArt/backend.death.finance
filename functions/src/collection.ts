import _ from 'lodash';
import { ICumulativeCollectionStats, ICumulativeFighterStats } from './matches/matches';

export const updateCumulativeCollectionStats = async (collection: any, db: any) => {
  const seasonPath = db
    .collection('nft-death-games')
    .doc('season_0');
  try {
    const fighters = await seasonPath
      .collection('fighters')
      .where('collection', '==', collection.id)
      .where('statsDone', '==', true)
      .get();

    const collectionStats: ICumulativeCollectionStats = fighters
      .map((fighter: any) => fighter.stats)
      .reduce(addCumulativeStats);

    await seasonPath
      .collection('collections')
      .doc(collection.id)
      .update({
        stats: collectionStats,
        updateStats: false,
        statsDone: true,
      });
  } catch (error) {
    console.error(error);
    throw new Error(`updateCumulativeCollectionStats failed`);
  }
};

export const addCumulativeStats = (
  cumulativeStats: ICumulativeFighterStats,
  currentFighterStats: ICumulativeFighterStats
): ICumulativeCollectionStats => {
  return {
    won: cumulativeStats.won + currentFighterStats.won,
    knockedOutOpponent: cumulativeStats.knockedOutOpponent + currentFighterStats.knockedOutOpponent,
    perfectedOpponent: cumulativeStats.perfectedOpponent + currentFighterStats.perfectedOpponent,
    uninjured: cumulativeStats.uninjured + currentFighterStats.uninjured,
    untouched: cumulativeStats.untouched + currentFighterStats.untouched,
    pattyCaked: cumulativeStats.pattyCaked + currentFighterStats.pattyCaked,
    boutsFought: cumulativeStats.boutsFought + currentFighterStats.boutsFought,
    dodges: cumulativeStats.dodges + currentFighterStats.dodges,
    criticals: cumulativeStats.criticals + currentFighterStats.criticals,
    counterAttacks: cumulativeStats.counterAttacks + currentFighterStats.counterAttacks,
    misses: cumulativeStats.misses + currentFighterStats.misses,
    damageDealt: cumulativeStats.damageDealt + currentFighterStats.damageDealt,
    damageReceived: cumulativeStats.damageReceived + currentFighterStats.damageReceived,
  };
};
