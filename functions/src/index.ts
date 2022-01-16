import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import * as triggerFunctions from './triggers';

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

// THis should be moved to it's own thing
export const simulateFight = firebaseFunction.https
  .onCall((params, context) => triggerFunctions.simulateFight(admin, params, context));
