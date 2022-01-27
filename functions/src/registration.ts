import moment from 'moment';
import fetch from 'node-fetch';
import * as functions from 'firebase-functions';

export const registerFighter = async (admin: any, { ownerAddress, collection, contract, token_id, playerId }: any, context: any) => {
  const db = admin.firestore();

  try {
    console.log(`On OpenSea, fetching contract ${contract} and token ${token_id}.`);
    const openSeaResult = await fetch(`https://api.opensea.io/api/v1/asset/${contract}/${token_id}`, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
      }
    });

    const openSeaData = await openSeaResult.json();
    if (openSeaData.success == false) {
      throw new Error(`Request to OpenSea failed`);
    }

    if (String(openSeaData.id) !== String(playerId)) {
      throw new Error(`openSeaData ID ${String(openSeaData.id)} does not match player ID ${String(playerId)}`);
    }

    if (openSeaData.collection.slug !== collection) {
      throw new Error(`looks like you're cheating`);
    }

    const fightersRef = await db
      .collection('nft-death-games')
      .doc('season_0')
      .collection('fighters');

    const unRegisteredPlayer = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('collections')
      .doc(collection)
      .collection('players')
      .doc(String(playerId))
      .get();

    const owner = ownerAddress.toLowerCase();

    if (!unRegisteredPlayer.exists) {
      // Set fighter as invalid since it wasn't a possible player.
      await setFighterData(
        true,
        fightersRef,
        playerId,
        collection,
        owner,
        {
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
        }
      );
      return;
    }

    const isOwner = owner === openSeaData.owner.address;
    if (!isOwner) {
      throw new Error('not the owner');
    }

    // Make owner document
    await db.collection('nft-death-games')
      .doc('season_0')
      .collection('users')
      .doc(owner)
      .set({
        address: owner,
      }, { merge: true });

    const existingFighter = await fightersRef
      .doc(String(playerId))
      .get();

    if (existingFighter.exists) {
      await fightersRef
        .doc(String(playerId))
        .update({
          owner,
        });
    } else {
      await setFighterData(
        false,
        fightersRef,
        playerId,
        collection,
        owner,
        unRegisteredPlayer.data()
      );
    }

    await updateOwnerForPlayer(db, collection, playerId, owner);

  } catch (error) {
    const msg = getErrorMessage(error);
    throw new functions.https.HttpsError('internal', msg || 'failed to register fighter');
  }
};

const updateOwnerForPlayer = async (
  db: any,
  collection: any,
  playerId: any,
  owner: any) => {
  await db.collection('nft-death-games')
    .doc('season_0')
    .collection('collections')
    .doc(collection)
    .collection('players')
    .doc(String(playerId))
    .update({
      owner,
    });
};

const setFighterData = async (
  invalid: boolean,
  fightersRef: any,
  playerId: any,
  collection: any,
  owner: any,
  playerData: any) => {
  await fightersRef
    .doc(String(playerId))
    .set({
      collection,
      owner,
      id: String(playerId),
      timestamp: moment().format('x'),
      is_invalid: invalid,
      is_doping: playerData.power >= 79,
      player: playerData,
    });
};

const getErrorMessage = (error: unknown) => {
  console.log(error);

  if (error instanceof Error) {
    return error.message;
  }

  return '';
};
