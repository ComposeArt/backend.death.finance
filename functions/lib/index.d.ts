import * as functions from 'firebase-functions';
export declare const updateGoerli: functions.CloudFunction<unknown>;
export declare const onCreateFighter: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const onUpdateFighter: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
export declare const onCreateMatch: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const onUpdateMatch: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const simulateFight: functions.TriggerAnnotated & ((req: functions.Request<import("express-serve-static-core").ParamsDictionary>, resp: functions.Response<any>) => void | Promise<void>) & functions.Runnable<any>;
export declare const registerFighter: functions.TriggerAnnotated & ((req: functions.Request<import("express-serve-static-core").ParamsDictionary>, resp: functions.Response<any>) => void | Promise<void>) & functions.Runnable<any>;
