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

    const openseaResult = await fetch(`https://api.opensea.io/api/v1/asset/${contract}/${token_id}`, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
      }
    });

    const openseaData = await openseaResult.json();

    if (String(openseaData.id) !== String(playerId) || openseaData.collection.slug !== collection) {
      throw new Error('looks like your cheating');
    }

    const fightersRef = await db.collection('nft-death-games').doc('season_0').collection('fighters');

    if (unRegisteredPlayer.exists) {
      const playerData = unRegisteredPlayer.data();

      const openSeaOwnerAddress = openseaData.owner.address;

      const isOwner = ownerAddress === openSeaOwnerAddress;

      if (!isOwner) {
        throw new Error('not the owner');
      }

      const existingPlayersQuery = await fightersRef
        .doc(String(playerId))
        .get();

      if (!existingPlayersQuery.exists) {
        await fightersRef
          .doc(String(playerId))
          .set({
            collection,
            owner,
            id: String(playerId),
            timestamp: moment().format('x'),
            player: playerData,
            is_doping: playerData.power === 84,
          });

        await await db.collection('nft-death-games')
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

        await await db.collection('nft-death-games')
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
          player: {
            id: String(playerId),
            token_id,
            image_url: openseaData.image_url,
            image_preview_url: openseaData.image_preview_url,
            image_thumbnail_url: openseaData.image_thumbnail_url,
            name: openseaData.name,
            description: openseaData.description,
            permalink: openseaData.permalink,
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
