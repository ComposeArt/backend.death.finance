import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp(functions.config().firebase);

const firebaseFunction = functions.region();

// ----------------- //
//     SCHEDULED     //
// ----------------- //

// export const dataDump = firebaseFunction.pubsub
//   .schedule('every day 00:00')
//   .onRun(async () => scheduleFunctions.dataDump(admin));

// ------------------ //
//      TRIGGERS      //
// ------------------ //

// export const writeCustomers = firebaseFunction.firestore
//   .document('customers/{customer}')
//   .onWrite((snap, context) => triggerFunctions.writeCustomers(admin, snap, context));
