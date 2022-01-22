require('dotenv').config();

import { initializeApp } from "firebase/app";
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
const registerFighter = httpsCallable(functions, 'registerFighter');

const registerFighterFxn = async () => {
    const result = await registerFighter({ ownerAddress: '0x5bf79ed30cf295401e2bdfc4431af8b1cdf038f1', collection: 'flowtys', playerId: 45194744}).catch((error) => {
        console.log("registerFighterFxn received error %s", error);
    });
    console.log("registerFighterFxn result: %s", result);
};

const simulateFightFxn = async () => {

    let response:any = await simulateFight({
        isSimulated: false,
        f1: {
            collection: 'minitaurs-reborn',
            id: '182521675',
        },
        f2: {
            collection: 'galaktic-gang',
            id: '150340670',
        },
        random: '1',
        blockNumber: '1'
    });
    response = response.data;

    let secondaryResponse:any = await simulateFight({
        isSimulated: true,
        f1: {
            collection: 'minitaurs-reborn',
            id: '182521675',
        },
        f2: {
            collection: 'galaktic-gang',
            id: '150340670',
        },
        random: response.randomness.toString(),
        blockNumber: response.blockNumber.toString()
    });

    secondaryResponse = secondaryResponse.data;
    console.log("eventLog replayable?: ", secondaryResponse.eventLog == response.eventLog);

    let eventLog = response.eventLog;
    const EVENT_SIZE = 9;
    let isTie = (eventLog.length % EVENT_SIZE) == 1;
    for(let i = 1; i < eventLog.length - 1; i+=EVENT_SIZE) {
        console.log(`${parseInt(eventLog.substring(i, i+1), 2) == 0 ? "P1 Attack:": "P2 Attack:"} ${parseInt(eventLog.substring(i+1, i+5), 2)}, ${parseInt(eventLog.substring(i, i+1), 2) == 0 ? "P2 Counter:": "P1 Counter:"} ${parseInt(eventLog.substring(i+5, i+EVENT_SIZE), 2)}`);
    }
    console.log(`${isTie ? "TIE!" : parseInt(eventLog.substring(eventLog.length-1, eventLog.length), 2) == 0 ? "Fighter 1 Wins!" : "Fighter 2 Wins!"}`);
}
simulateFightFxn()
registerFighterFxn()
