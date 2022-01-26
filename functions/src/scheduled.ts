import * as functions from 'firebase-functions';
import { ethers } from 'ethers';

import FightClub from './FightClub.json';

export const updateGoerli = async (admin: any) => {
  
    try {
        const db = admin.firestore();
        const contractAddress = '0xEA896aA63f6495f50a26c49749306b28B07E79e0';

        const infuraProvider = new ethers.providers.InfuraProvider('goerli', functions.config().infura.id);
        const wallet = new ethers.Wallet(`${functions.config().ethereum.deployer_private_key}`, infuraProvider);
        const signer = wallet.connect(infuraProvider);
    
        const fightClub = new ethers.Contract(
            contractAddress,
            FightClub.abi,
            signer
        );
        const blockNumber = (await infuraProvider.getBlock(await infuraProvider.getBlockNumber())).number;
        const randomness = (await fightClub.getRandomness()).toString();
        
        await db.collection('chains').doc('goerli')
            .update({
                contractAddress,
                randomness,
                blockNumber
            });
    } catch (error) {
        console.error(error);
        throw new Error('Export operation failed');
    }
};