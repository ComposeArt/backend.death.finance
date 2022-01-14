import * as functions from 'firebase-functions';
export declare const writeDeathGamesCollectionPlayers: functions.CloudFunction<functions.Change<functions.firestore.DocumentSnapshot>>;
export declare const simulateFight: functions.TriggerAnnotated & ((req: functions.Request<import("express-serve-static-core").ParamsDictionary>, resp: functions.Response<any>) => void | Promise<void>) & functions.Runnable<any>;
