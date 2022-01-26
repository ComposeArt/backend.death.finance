import moment from 'moment';
import fetch from 'node-fetch';
import * as functions from 'firebase-functions';

export const registerFighter = async (admin: any, { ownerAddress, collection, contract, token_id, playerId }: any, context: any) => {
  const db = admin.firestore();

  try {
    const owner = ownerAddress.toLowerCase();

    const unRegisteredPlayer = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('collections')
      .doc(collection)
      .collection('players')
      .doc(String(playerId))
      .get();

    const openSeaResult = await fetch(`https://api.opensea.io/api/v1/asset/${contract}/${token_id}`, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
      }
    });

    const openSeaData = await openSeaResult.json();

    if (String(openSeaData.id) !== String(playerId) || openSeaData.collection.slug !== collection) {
      throw new Error('looks like your cheating');
    }

    const fightersRef = await db.collection('nft-death-games').doc('season_0').collection('fighters');

    if (unRegisteredPlayer.exists) {
      const playerData = unRegisteredPlayer.data();

      const openSeaOwnerAddress = openSeaData.owner.address;

      const isOwner = ownerAddress === openSeaOwnerAddress;

      if (!isOwner) {
        throw new Error('not the owner');
      }

      const existingPlayersQuery = await fightersRef
        .doc(String(playerId))
        .get();

      await db.collection('nft-death-games')
        .doc('season_0')
        .collection('users')
        .doc(owner)
        .set({
          address: owner,
        }, { merge: true });

      if (!existingPlayersQuery.exists) {
        await fightersRef
          .doc(String(playerId))
          .set({
            collection,
            owner,
            id: String(playerId),
            timestamp: moment().format('x'),
            player: playerData,
            is_doping: playerData.power >= 79,
            is_invalid: false,
          });

        await db.collection('nft-death-games')
          .doc('season_0')
          .collection('collections')
          .doc(collection)
          .collection('players')
          .doc(String(playerId))
          .update({
            owner,
          });
      } else {
        await fightersRef
          .doc(String(playerId))
          .update({
            owner,
          });

        await db.collection('nft-death-games')
          .doc('season_0')
          .collection('collections')
          .doc(collection)
          .collection('players')
          .doc(String(playerId))
          .update({
            owner,
          });
      }
    } else {
      await fightersRef
        .doc(String(playerId))
        .set({
          collection,
          owner,
          id: String(playerId),
          timestamp: moment().format('x'),
          is_invalid: true,
          is_doping: false,
          player: {
            id: String(playerId),
            token_id,
            image_url: openSeaData.image_url,
            image_preview_url: openSeaData.image_preview_url,
            image_thumbnail_url: openSeaData.image_thumbnail_url,
            name: openSeaData.name,
            description: openSeaData.description,
            permalink: openSeaData.permalink,
            collection,
            season: 'season_0',
          },
        });
    }
  } catch (error) {
    const msg = getErrorMessage(error);

    throw new functions.https.HttpsError('internal', msg || 'failed to register fighter');
  }
};

const getErrorMessage = (error: unknown) => {
  console.log(error);

  if (error instanceof Error) {
    return error.message;
  }

  return '';
};
