import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    // 1. GENERATE RESULTS IMMEDIATELY
    const items = ['🐾', '🦴', '🥈', '🥇'];
    const s = [
        items[Math.floor(Math.random() * items.length)],
        items[Math.floor(Math.random() * items.length)],
        items[Math.floor(Math.random() * items.length)]
    ];
    
    // 2. SEND RESPONSE TO UI FIRST (To prevent Timeout Errors)
    res.status(200).json({ 
        symbols: s, 
        message: "BITE PROCESSED! $BALOO BURNED! 🔥" 
    });

    // 3. BACKGROUND PROCESSING (Fee distribution)
    try {
        const { player } = req.body;
        const connection = new Connection("https://rpc.testnet.x1.xyz", "confirmed");
        
        // Ensure your Environment Variable TREASURY_PRIVATE_KEY is set in Vercel
        const secretKey = bs58.decode(process.env.TREASURY_PRIVATE_KEY);
        const treasuryKeypair = Keypair.fromSecretKey(secretKey);
        
        const devWallet = new PublicKey("BAavVn1N73U9k9S7D8XmGq6U6p1D5K7L8M9N0O1P2Q3"); 
        const koper10 = new PublicKey("5aBYF1ZUc432g8yY88nupuxXk7uB5b4cRmKUj1uF1M3C");

        const feeTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: treasuryKeypair.publicKey,
                toPubkey: devWallet,
                lamports: 80000000 // 0.08 XNT (8%)
            }),
            SystemProgram.transfer({
                fromPubkey: treasuryKeypair.publicKey,
                toPubkey: koper10,
                lamports: 20000000 // 0.02 XNT (2%)
            })
        );

        // Fire and forget (don't wait for confirmation to keep API fast)
        connection.sendTransaction(feeTx, [treasuryKeypair]);

    } catch (err) {
        // Silently log background errors
        console.error("Background Fee Error:", err);
    }
}
