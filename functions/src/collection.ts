import _ from 'lodash';
import { ICumulativeStats } from './matches/matches';

export const updateCumulativeCollectionStats = async (collection: any, db: any) => {
  const seasonPath = db
    .collection('nft-death-games')
    .doc('season_0');
  try {
    const fighterDocs = await seasonPath
      .collection('fighters')
      .where('collection', '==', collection.id)
      .where('statsDone', '==', true)
      .get();

    const fighters: any = [];

    fighterDocs.forEach((fighterDoc: any) => fighters.push(fighterDoc.data().stats));

    const collectionStats: ICumulativeStats = fighters.reduce(addCumulativeStats);

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
  cumulativeStats: ICumulativeStats,
  currentFighterStats: ICumulativeStats
): ICumulativeStats => {
  return {
    matches: cumulativeStats.matches + currentFighterStats.matches,
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
