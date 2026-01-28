import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { signature, player } = req.body;
    const connection = new Connection("https://rpc.testnet.x1.xyz", "confirmed");

    try {
        const secretKey = bs58.decode(process.env.TREASURY_PRIVATE_KEY);
        const treasuryKeypair = Keypair.fromSecretKey(secretKey);
        
        const devWallet = new PublicKey("BAavVn1N73U9k9S7D8XmGq6U6p1D5K7L8M9N0O1P2Q3"); 
        const koper10 = new PublicKey("5aBYF1ZUc432g8yY88nupuxXk7uB5b4cRmKUj1uF1M3C");

        // Prepare the Fee Split
        const feeTx = new Transaction().add(
            SystemProgram.transfer({ fromPubkey: treasuryKeypair.publicKey, toPubkey: devWallet, lamports: 80000000 }),
            SystemProgram.transfer({ fromPubkey: treasuryKeypair.publicKey, toPubkey: koper10, lamports: 20000000 })
        );
        
        // FIRE AND FORGET: We don't use 'await' here so the UI stays fast
        connection.sendTransaction(feeTx, [treasuryKeypair]).catch(e => console.error("Fee failed but game continues", e));

        // SPIN LOGIC
        const items = ['🐾', '🦴', '🥈', '🥇'];
        const s = [items[Math.floor(Math.random()*4)], items[Math.floor(Math.random()*4)], items[Math.floor(Math.random()*4)]];
        
        let winAmount = 0;
        let msg = "BET LOST - $BALOO BURNED! 🔥";
        if (s[0] === s[1] && s[1] === s[2]) {
            winAmount = 2000000000; // Example: 2X win
            msg = "WINNER! 2X RETURNED!";
        }

        if (winAmount > 0) {
            const payTx = new Transaction().add(
                SystemProgram.transfer({ fromPubkey: treasuryKeypair.publicKey, toPubkey: new PublicKey(player), lamports: winAmount })
            );
            await connection.sendTransaction(payTx, [treasuryKeypair]);
        }

        return res.status(200).json({ symbols: s, message: msg });

    } catch (err) {
        return res.status(500).json({ error: "Blockchain lag - check wallet for results!" });
    }
}
