import moment from 'moment';
import fetch from 'node-fetch';
import * as functions from 'firebase-functions';

export const registerFighter = async (admin: any, { ownerAddress, collection, playerId }: any, context: any) => {
  const db = admin.firestore();

  try {
    const unRegisteredPlayer = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('collections')
      .doc(collection)
      .collection('players')
      .doc(String(playerId))
      .get();

    const openseaData = unRegisteredPlayer.data();
    const isOwner = await isCorrectOwner(openseaData.permalink, ownerAddress);

    if (!isOwner) {
      throw new functions
        .https
        .HttpsError('invalid-argument', 'not the owner');
    }

    try {
      const fightersRef = await db.collection('nft-death-games')
        .doc('season_0')
        .collection('fighters');

      const existingPlayersQuery = await fightersRef
        .where('player', '==', String(playerId))
        .get();

      const playerAlreadyRegistered = !existingPlayersQuery.empty;

      if (playerAlreadyRegistered) {
        throw new functions
          .https
          .HttpsError('invalid-argument', 'fighter already registered');
      } else {
        fightersRef
          .doc()
          .set({
            collection,
            owner: ownerAddress,
            player: String(playerId),
            timestamp: moment().format('x'),
            opensea: openseaData,
          });
      }
    } catch (error) {
      console.log('Error saving new fighter:', error);
    }
  } catch (error) {
    console.log('Error retrieving player:', error);
  }
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
