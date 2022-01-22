import moment from 'moment';
import fetch from 'node-fetch';
import * as functions from 'firebase-functions';

export const registerFighter = async (admin: any, { ownerAddress, collection, playerId }: any, context: any) => {
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

    if (!unRegisteredPlayer.exists) {
      throw new Error('NFT not included this season');
    }

    const playerData = unRegisteredPlayer.data();
    const isOwner = await isCorrectOwner(playerData.permalink, owner);

    if (!isOwner) {
      throw new Error('not the owner');
    }

    const fightersRef = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('fighters');

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

const isCorrectOwner = async (fighterLink: any, ownerAddress: any) => {
  // Get characters from "0x" to end of URL. The URL doesn't specify
  // collection names, so there isn't a risk of collision on a collection name containing "0x".
  const beginIndex = fighterLink.indexOf('0x');
  const fighterAddress = fighterLink.slice(-(fighterLink.length - beginIndex));

  const checkOwnershipResult = await fetch(`https://api.opensea.io/api/v1/asset/${fighterAddress}`, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
    }
  });
  const asJson = await checkOwnershipResult.json();
  const openSeaOwnerAddress = asJson.owner.address;

  const isOwner = ownerAddress === openSeaOwnerAddress;

  return isOwner;
};
