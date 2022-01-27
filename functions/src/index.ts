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

// ------------------ //
//      TRIGGERS      //
// ------------------ //

export const onCreateFighter = firebaseFunction.firestore
  .document('nft-death-games/{seasonId}/fighters/{fighterId}')
  .onCreate((snap, context) => triggerFunctions.createFighterImage(admin, snap, context));

export const onCreateMatch = firebaseFunction.firestore
  .document('nft-death-games/{seasonId}/matches/{matchId}')
  .onCreate((snap, context) => triggerFunctions.createMatchImage(admin, snap, context));

export const fighterUpdated = firebaseFunction.firestore
  .document('nft-death-games/{seasonId}/fighters/{fighterId}')
  .onUpdate(async (change, context) => await triggerFunctions.fighterUpdated(change, context, admin));

// export const onWriteFighter = firebaseFunction.firestore
//   .document('nft-death-games/{seasonId}/fighters/{fighterId}')
//   .onWrite((snap, context) => triggerFunctions.onWriteFighter(admin, snap, context));

// ------------------ //
//      CALLABLE      //
// ------------------ //

export const simulateFight = firebaseFunction.https
  .onCall((params, context) => simulateFunctions.simulateFight(admin, params, context));

export const registerFighter = firebaseFunction.https
  .onCall((params, context) => registrationFunctions.registerFighter(admin, params, context));

