import _ from 'lodash';
import nodeHtmlToImage from 'node-html-to-image';
import * as functions from 'firebase-functions';

export const createFighterImage = async (admin: any, snap: any, context: any) => {
    const db = admin.firestore();
    const storage = admin.storage();

    let fighter = snap.after.data() || {};

    try {
        if (fighter != undefined) {
            fighter = fighter.player
            if (fighter != undefined) {
                const bucket = storage.bucket();
                const fileName = `fighters/${fighter.id}.png`;
                const file = bucket.file(fileName);
                const exists = await file.exists();

                if (!exists[0]) {
                    const image = await nodeHtmlToImage({
                        html: `
                        <html>
                            <head>
                            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono">
                            </head>
                            <body style="width: 1024px; height: 512px;">
                            <div style="background-color: #1A202C; width: 1024px; height: 512px; display: flex; justify-content: center; align-items: center;">
                                <div style="width: 512px; height: 512px;">
                                <img style="width: 512px; height: 512px; opacity: 0.6;" src="${fighter.image_url}" />
                                </div>
                                <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 512px; height: 80px; position: absolute; z-index: 10; left: 0; bottom: 100px;">
                                ${fighter.collection} #${_.truncate(fighter.token_id, { length: 7 })}
                                </div>
                                <div style="width: 512px; height: 512px;">
                                <img style="width: 256px; height: 256px; position: absolute; top: 100px; right: 128px;" src="https://death.finance/fight-club-logo-light.png" />
                                <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 512px; height: 80px; position: absolute; z-index: 10; left: 512px; bottom: 100px;">
                                    death.finance
                                </div>
                                </div>
                            </div>
                            </body>
                        </html>
                        `
                    });

                    await file.save(image, { contentType: 'image/png' });
                    await file.makePublic();
                }
            }
        }

        
        await db.collection('nft-death-games').doc('season_0').collection('fighters').doc(snap.after.id).update({
            'updateProfile': true,
            'updateCollection': true
        });
    } catch (error) {
        console.error(error);
    }
};

export const fighterUpdated = async (change: any, context: any, admin: any) => {
    const db = admin.firestore();  
    const storage = admin.storage();

    const oldFighter = change.before.data();
    const fighter = change.after.data();

    try {
        if (!oldFighter.updateProfile && fighter.updateProfile) {
            await updateProfileImage(db, storage, fighter);
        }

        if (fighter.updateCollection) {
            await updateCollectionImage(db, storage, fighter);
        }
    } catch (error) {
        console.error(error);
    }
}

const updateProfileImage = async (db: any, storage: any, fighter: any) => {
    const fighterDocs = await db.collection('nft-death-games')
        .doc('season_0')
        .collection('fighters')
        .where('owner', '==', fighter.owner)
        .limit(4)
        .get();

    let players: any = [];
    fighterDocs.forEach(async (fighterDoc: any) => {
        if (players.length < 4)
        players.push(fighterDoc.data().player);
    });

    let image = null;
    const bucket = storage.bucket();
    const fileName = `profiles/${fighter.owner}.png`;
    const file = bucket.file(fileName);
    const exists = await file.exists();

    if (!exists[0]) {
            
        if (players.length == 1) {
            image = await nodeHtmlToImage({
            html: `
                <html>
                <head>
                    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono">
                </head>
                <body style="width: 1024px; height: 512px;">
                    <div style="background-color: #1A202C; width: 1024px; height: 512px; display: flex; justify-content: center; align-items: center;">
                    <div style="width: 512px; height: 512px;">
                        <img style="width: 512px; height: 512px; opacity: 0.6;" src="${players[0].image_url}" />
                    </div>
                    <div style="width: 512px; height: 512px;">
                        <img style="width: 256px; height: 256px; position: absolute; top: 100px; right: 128px;" src="https://death.finance/fight-club-logo-light.png" />
                        <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 512px; height: 80px; position: absolute; z-index: 10; left: 512px; bottom: 100px;">
                        death.finance
                        </div>
                    </div>
                    </div>
                </body>
                </html>
            `
            });
        } else {
            if (players.length == 2) {
            players = players.concat([players[1], players[0]]);
            } else if (players.length == 3) {
            players = players.push(players[0]);
            }

            image = await nodeHtmlToImage({
            output: './profile.png',
            html: `
                <html>
                <head>
                    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono">
                </head>
                <body style="width: 1024px; height: 512px;">
                    <div style="background-color: #1A202C; width: 1024px; height: 512px; display: flex; justify-content: center; align-items: center;">
                    <div width: 256px; height: 512px; display: flex; flex-direction: column;">
                        <div style="width: 254px; height: 254px; border: 2px solid #1A202C; ">
                        <img style="width: 254px; height: 254px; opacity: 0.6;" src="${players[0].image_url}" />
                        </div>
                        <div style="width: 254px; height: 254px; border: 2px solid #1A202C; ">
                        <img style="width: 254px; height: 254px; opacity: 0.6;" src="${players[1].image_url}" />
                        </div>
                    </div>
                    <div width: 256px; height: 512px; display: flex; flex-direction: column;">
                        <div style="width: 254px; height: 254px; border: 2px solid #1A202C; ">
                        <img style="width: 254px; height: 254px; opacity: 0.6;" src="${players[2].image_url}" />
                        </div>
                        <div style="width: 254px; height: 254px; border: 2px solid #1A202C; ">
                        <img style="width: 254px; height: 254px; opacity: 0.6;" src="${players[3].image_url}" />
                        </div>
                    </div>
                    <div style="width: 512px; height: 512px;">
                        <img style="width: 256px; height: 256px; position: absolute; top: 100px; right: 128px;" src="https://death.finance/fight-club-logo-light.png" />
                        <div style="font-family: 'Fira Mono', monospace; font-weight: 900; text-align: center; font-size: 32px; color: white; width: 512px; height: 80px; position: absolute; z-index: 10; left: 512px; bottom: 100px;">
                        death.finance
                        </div>
                    </div>
                    </div>
                </body>
                </html>
            `
            });
        }

        await file.save(image, { contentType: 'image/png' });
        await file.makePublic();
    }
    
    await db.collection('nft-death-games').doc('season_0').collection('fighters').doc(fighter.id).update({
        'updateProfile': false
    });
};

const updateCollectionImage = async (db: any, storage: any, fighter: any) => { 
    await db.collection('nft-death-games').doc('season_0').collection('fighters').doc(fighter.id).update({
        'updateCollection': false
    });
};
