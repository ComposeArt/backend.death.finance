import moment from 'moment';
import fetch from 'node-fetch';
import _ from 'lodash';
import * as functions from 'firebase-functions';

const getAssets = async ({
  results,
  address,
  offset,
}: any): Promise<any> => {
  const response = await fetch(`https://api.opensea.io/api/v1/assets?owner=${address}&limit=50&offset=${offset}`, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
      'X-API-KEY': functions.config().opensea.key
    }
  });

  const data = await response.json();

  results = [...results, ...data.assets];

  if (data.assets && data.assets.length > 0) {
    return getAssets({
      results,
      address,
      offset: offset + 50,
    });
  } else {
    return results;
  }
};

export const createUser = async (admin: any, { address }: any) => {
  const db = admin.firestore();

  try {
    const userDoc = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('users')
      .doc(address)
      .get();

    if (!userDoc.exists) {
      await db.collection('nft-death-games')
        .doc('season_0')
        .collection('users')
        .doc(address)
        .set({
          address,
          registered: 0,
          chaos: 0,
          highest_placement: 0,
        });
    }
  } catch (error) {
    const msg = getErrorMessage(error);
    throw new functions.https.HttpsError('internal', msg || 'failed to save address');
  }
};

export const connectDiscordUser = async (admin: any, { token, address }: any) => {
  const db = admin.firestore();

  try {
    const userDoc = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('users')
      .doc(address)
      .get();

    const discordDocs = await db.collection('users')
      .where('token', '==', token)
      .get();

    let discord: any = {};

    discordDocs.forEach((discordDoc: any) => {
      discord = discordDoc.data();
    });

    if (userDoc.exists && !_.isEmpty(discord)) {
      await db.collection('nft-death-games')
        .doc('season_0')
        .collection('users')
        .doc(address)
        .update({
          discord,
        });
    }
  } catch (error) {
    const msg = getErrorMessage(error);
    throw new functions.https.HttpsError('internal', msg || 'failed to connect');
  }
};

export const getAddressNFTs = async (admin: any, { ownerAddress }: any, context: any) => {
  const db = admin.firestore();

  try {
    const collectionDocs = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('collections')
      .get();

    const collections: any = [];

    collectionDocs.forEach((collectionDoc: any) => collections.push(collectionDoc.id));

    const assets = await getAssets({
      results: [],
      address: ownerAddress,
      offset: 0,
    });

    return _.filter(assets, (a: any) => _.find(collections, (c: any) => c === a.collection.slug));
  } catch (error) {
    const msg = getErrorMessage(error);
    throw new functions.https.HttpsError('internal', msg || 'failed to get nfts');
  }
};

export const registerFighter = async (admin: any, { ownerAddress, collection, contract, token_id, playerId }: any, context: any) => {
  const db = admin.firestore();

  try {
    console.log(`On OpenSea, fetching contract ${contract} and token ${token_id}.`);
    const openSeaResult = await fetch(`https://api.opensea.io/api/v1/asset/${contract}/${token_id}`, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
        'X-API-KEY': functions.config().opensea.key
      }
    });

    const openSeaData = await openSeaResult.json();
    if (openSeaData.success === false) {
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
    const username = _.get(openSeaData, 'owner.user.username', '');

    if (!isOwner) {
      throw new Error('not the owner');
    }

    const userDoc = await db.collection('nft-death-games')
      .doc('season_0')
      .collection('users')
      .doc(owner)
      .get();

    if (userDoc.exists) {
      const user = userDoc.data();

      await db.collection('nft-death-games')
        .doc('season_0')
        .collection('users')
        .doc(owner)
        .update({
          address: owner,
          registered: user.registered + 1,
          username,
        });
    } else {
      await db.collection('nft-death-games')
        .doc('season_0')
        .collection('users')
        .doc(owner)
        .set({
          address: owner,
          registered: 1,
          username,
        });
    }

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

const isFightingBlock = (blockNumber: number): boolean => {
  return _.floor(parseInt(blockNumber.toString(), 10) / 10 % 2) === 1;
};

export const schedulePreSeasonMatches = async (
  db: any,
  fighter: any,
) => {
  const allFighterSnapshot = await db.collection('nft-death-games')
    .doc('season_0')
    .collection('fighters')
    .where('is_doping', '==', false)
    .where('is_invalid', '==', false)
    .where('id', '!=', fighter.id)
    .get();

  let scheduledMatchBlock = await getCurrentBlockNumber(db);
  scheduledMatchBlock += 100;

  const allFighters = allFighterSnapshot.docs.map((f: any) => f.data());

  await Promise.all(allFighters.map(async (otherFighter: any) => {
    scheduledMatchBlock += 1;

    if (!isFightingBlock(scheduledMatchBlock)) {
      scheduledMatchBlock += 10;
    }

    await scheduleMatch(db, fighter, otherFighter, scheduledMatchBlock);

    scheduledMatchBlock += 1;

    if (!isFightingBlock(scheduledMatchBlock)) {
      scheduledMatchBlock += 10;
    }

    await scheduleMatch(db, otherFighter, fighter, scheduledMatchBlock);
  }));

  await db.collection('nft-death-games').doc('season_0').collection('fighters').doc(fighter.id).update({
    updateMatches: false,
  });
};

const getCurrentBlockNumber = async (db: any): Promise<number> => {
  const goerli = await db.collection('chains')
    .doc('goerli')
    .get();
  return parseInt(goerli.data().blockNumber, 10);
};

const scheduleMatch = async (db: any, firstFighter: any, secondFighter: any, block: number) => {
  await db.collection('nft-death-games')
    .doc('season_0')
    .collection('matches')
    .doc(`${firstFighter.id}-${secondFighter.id}`)
    .set({
      id: `${firstFighter.id}-${secondFighter.id}`,
      collection1: firstFighter.collection,
      collection2: secondFighter.collection,
      fighter1: firstFighter.id,
      fighter2: secondFighter.id,
      owner1: firstFighter.owner,
      owner2: secondFighter.owner,
      player1: firstFighter.player,
      player2: secondFighter.player,
      block: String(block),
      randomness: '', // This will be back filled when the fight is simulated with the randomness
      log: '', // This will be back filled
    });
};
