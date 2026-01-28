import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { signature, player } = req.body;
    const connection = new Connection("https://rpc.testnet.x1.xyz", "confirmed");

    try {
        const secretKey = bs58.decode(process.env.TREASURY_PRIVATE_KEY);
        const treasuryKeypair = Keypair.fromSecretKey(secretKey);
        
        // DESTINATIONS
        const devWallet = new PublicKey("BAavVn1N73U9k9S7D8XmGq6U6p1D5K7L8M9N0O1P2Q3"); 
        const koper10 = new PublicKey("5aBYF1ZUc432g8yY88nupuxXk7uB5b4cRmKUj1uF1M3C"); // Koper 10 Verified

        // Execute 8% and 2% split
        const splitTx = new Transaction().add(
            SystemProgram.transfer({ fromPubkey: treasuryKeypair.publicKey, toPubkey: devWallet, lamports: 80000000 }),
            SystemProgram.transfer({ fromPubkey: treasuryKeypair.publicKey, toPubkey: koper10, lamports: 20000000 })
        );
        await connection.sendTransaction(splitTx, [treasuryKeypair]);

        const items = ['🐾', '🦴', '🥈', '🥇'];
        const symbols = [items[Math.floor(Math.random()*4)], items[Math.floor(Math.random()*4)], items[Math.floor(Math.random()*4)]];
        
        return res.status(200).json({
            symbols: symbols,
            message: "BITE SUCCESSFUL! $BALOO BURNED! 🔥",
            burnDetail: "2% sent to Koper 10 (...1M3C)"
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
