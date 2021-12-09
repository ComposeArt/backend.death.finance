import _ from 'lodash';
import moment from 'moment';

import * as Games from './games';

export const writeDeathGamesCollectionPlayers = async (admin: any, snap: any, context: any) => {
  const db = admin.firestore();
  const playerBefore = snap.before.data() || {};
  const playerAfter = snap.after.data() || {};

  const season = context.params.season;
  const collection = context.params.collection;
  const playerId = context.params.player;

  if (!playerBefore.simulating && playerAfter.simulating) {
    await Games.saveGames({
      db,
      season,
      collection,
      p1: playerAfter,
    });

    await db.collection('nft-death-games')
      .doc(season)
      .collection('collections')
      .doc(collection)
      .collection('players')
      .doc(playerId)
      .update({
        simulating: false,
        latestSimulation: moment().utc().startOf('day').format('x'),
      });
  }
};
