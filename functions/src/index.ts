import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import * as simulateFunctions from './simulate';
import * as registrationFunctions from './registration';
import * as scheduleFunctions from './scheduled';
import * as triggerFunctions from './triggers';

admin.initializeApp(functions.config().firebase);

const firebaseFunction = functions.region('us-central1');

// ----------------- //
//     SCHEDULED     //
// ----------------- //

export const updateGoerli = firebaseFunction.pubsub
  .schedule('every 1 minutes')
  .onRun(async () => scheduleFunctions.updateGoerli(admin));

export const updateCollectionStats = firebaseFunction.pubsub
  .schedule('every 1 hours')
  .onRun(async () => scheduleFunctions.updateCollectionStats(admin));

export const updateSeasonRankings = firebaseFunction.pubsub
  .schedule('every 1 hours')
  .onRun(async () => scheduleFunctions.updateSeasonRankings(admin));

export const updateChaosAdded = firebaseFunction.pubsub
  .schedule('every 1 hours')
  .onRun(async () => scheduleFunctions.updateChaosAdded(admin));

// ------------------ //
//      TRIGGERS      //
// ------------------ //

export const onCreateFighter = firebaseFunction.firestore
  .document('nft-death-games/{seasonId}/fighters/{fighterId}')
  .onCreate(async (snap, context) => await triggerFunctions.createFighter(snap, admin));

export const onUpdateFighter = firebaseFunction
  .runWith({ timeoutSeconds: 300 })
  .firestore
  .document('nft-death-games/{seasonId}/fighters/{fighterId}')
  .onUpdate(async (change, context) => await triggerFunctions.updateFighter(change, admin));

export const onCreateMatch = firebaseFunction.firestore
  .document('nft-death-games/{seasonId}/matches/{matchId}')
  .onCreate(async (snap, context) => await triggerFunctions.createMatch(snap, admin));

export const onUpdateMatch = firebaseFunction.firestore
  .document('nft-death-games/{seasonId}/matches/{matchId}')
  .onUpdate(async (change, context) => await triggerFunctions.updateMatch(change, admin));

export const onUpdateBlock = firebaseFunction.firestore
  .document('chains/goerli')
  .onUpdate(async (change, context) => await triggerFunctions.updateBlock(change, admin));

export const onUpdateCollection = firebaseFunction.firestore
  .document('nft-death-games/{seasonId}/collections/{collectionId}')
  .onUpdate(async (change, context) => await triggerFunctions.updateCollection(change, admin));

export const onUpdateSeason = firebaseFunction.firestore
  .document('nft-death-games/{seasonId}')
  .onUpdate(async (change, context) => await triggerFunctions.updateSeason(change, admin));

export const onUpdateUser = firebaseFunction.firestore
  .document('nft-death-games/{seasonId}/users/{userId}')
  .onUpdate(async (change, context) => await triggerFunctions.updateUser(change, admin));

export const onUpdateFight = firebaseFunction.firestore
  .document('nft-death-games/{seasonId}/fights/{fightId}')
  .onUpdate(async (change, context) => await triggerFunctions.updateFight(change, admin));

// ------------------ //
//      CALLABLE      //
// ------------------ //

export const createUser = firebaseFunction.https
  .onCall((params, context) => registrationFunctions.createUser(admin, params));

export const connectDiscordUser = firebaseFunction.https
  .onCall((params, context) => registrationFunctions.connectDiscordUser(admin, params));

export const simulateFight = firebaseFunction.https
  .onCall((params, context) => simulateFunctions.simulateFight(admin, params));

export const registerFighter = firebaseFunction.https
  .onCall((params, context) => registrationFunctions.registerFighter(admin, params, context));

export const getAddressNFTs = firebaseFunction.https
  .onCall((params, context) => registrationFunctions.getAddressNFTs(admin, params, context));
