require('dotenv').config();

import * as admin from 'firebase-admin';

admin.initializeApp({
  projectId: 'composeart-f9a7a',
});
let db = admin.firestore();

export const setupGoerliForTest = async () => {
  console.log("setupGoerliForTest began.");
  try {
    await db.collection('chains').doc('goerli').create({
      blockNumber: 3,
      contractAddress: "0xc16e8A86E3834E04AfFADC3bFDFD3FA502190c1B",
      randomness: "84609896496648691675909856943781"
    });
    console.log(`setupGoerliForTest succeeded.`)
  } catch (error) {
    console.error(`setupGoerliForTest error: ${error}`);
  }
}

setupGoerliForTest();
