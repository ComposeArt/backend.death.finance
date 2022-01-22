import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import * as simulateFunctions from './simulate';
import * as registrationFunctions from './registration';

admin.initializeApp(functions.config().firebase);

const firebaseFunction = functions.region('us-central1');

// ----------------- //
//     SCHEDULED     //
// ----------------- //

// export const dataDump = firebaseFunction.pubsub
//   .schedule('every day 00:00')
//   .onRun(async () => scheduleFunctions.dataDump(admin));

// ------------------ //
//      TRIGGERS      //
// ------------------ //

// export const onCreateFighter = firebaseFunction.firestore
//   .document('nft-death-games/{seasonId}/fighters/{fighterId}')
//   .onCreate((snap, context) => triggerFunctions.onCreateFighter(admin, snap, context));

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
