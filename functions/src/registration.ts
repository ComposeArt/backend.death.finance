import moment from 'moment';
import fetch from 'node-fetch';

const functions = require('firebase-functions');

export const registerFighter = async (admin: any, { ownerAddress, collection, playerId }: any, context: any) => {
  const db = admin.firestore();
  console.log("Looking for player ID %s in collection %s with owner %s.", playerId, collection, ownerAddress);

  try {
    const unRegisteredPlayer = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('collections')
      .doc(collection)
      .collection('players')
      .doc(String(playerId))
      .get()

    const link = unRegisteredPlayer.data()["permalink"]
    const isOwner = await isCorrectOwner(link, ownerAddress);
    if (!isOwner) {
      throw new functions
        .https
        .HttpsError('invalid-argument', 'The owner address passed in does not match the owner address in OpenSea.');
    }

    try {
      const fightersRef = await db.collection('nft-death-games')
        .doc('season_0')
        .collection('fighters')

      const existingPlayersQuery = await fightersRef
        .where("player", "==", String(playerId))
        .get();

      const playerAlreadyRegistered = !existingPlayersQuery.empty
      if (playerAlreadyRegistered) {
        throw new functions
          .https
          .HttpsError('invalid-argument', 'Player already registered.');
      } else {
        fightersRef
        .doc()
        .set({
          collection: collection,
          owner: ownerAddress,
          player: String(playerId),
          timestamp: moment().format('x'),
        });
      }
    } catch (error) {
      console.log("Error saving new fighter:", error);
    }
  } catch (error) {
    console.log("Error retrieving player:", error);
  }
};

const isCorrectOwner = async (fighterLink: any, ownerAddress: any) => {
    // Get characters from "0x" to end of URL. The URL doesn't specify 
    // collection names, so there isn't a risk of collision on a collection name containing "0x".
    const beginIndex = fighterLink.indexOf('0x')
    const fighterAddress = fighterLink
      .slice(-(fighterLink.length - beginIndex))
    console.log("fighterAddress %s", fighterAddress);

    const checkOwnershipResult = await fetch(`https://api.opensea.io/api/v1/asset/${fighterAddress}`, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
      }
    });
    const asJson = await checkOwnershipResult.json();
    const openSeaOwnerAddress = asJson["owner"]["address"];
    const isOwner = ownerAddress === openSeaOwnerAddress;
    console.log("%s is the owner: %s", ownerAddress, isOwner);
    return isOwner;
};
