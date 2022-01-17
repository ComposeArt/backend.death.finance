require('dotenv').config();

import { initializeApp } from "firebase/app";

import { getApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";

import { ethers } from 'ethers';
import FightClub from './FightClub.json';

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

    let response:any = await simulateFight({
        isSimulated: false,
        fighterOneStats: 14325810,
        fighterTwoStats: 6627840,
        random: '47253922380151261668899214344815469786',
        blockNumber: '31'
    });
    response = response.data;

    let secondaryResponse:any = await simulateFight({
        isSimulated: true,
        fighterOneStats: 14325810,
        fighterTwoStats: 6627840,
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
