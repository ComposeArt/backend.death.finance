import { initializeApp } from "firebase/app";
import { getApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";

const app = initializeApp({
    apiKey: 'AIzaSyBK-EdRy8HJWm9LiMeLPr-q_kBTfSfTcVY',
    authDomain: 'composeart-f9a7a.firebaseapp.com',
    projectId: 'composeart-f9a7a',
    databaseURL: 'https://composeart-f9a7a.firebaseio.com',
});

const functions = getFunctions(app);
connectFunctionsEmulator(functions, "localhost", 5001);
const simulateFight = httpsCallable(functions, 'simulateFight');

const simulateFightFxn = async () => {
    const result = await simulateFight({ test: 'timmy' });
    console.log(result);
}

simulateFightFxn()