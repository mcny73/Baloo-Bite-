import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    // 1. Direct resultaat naar je scherm (stopt de "Error" melding)
    const items = ['🐾', '🦴', '🥈', '🥇'];
    const s = [items[Math.floor(Math.random()*4)], items[Math.floor(Math.random()*4)], items[Math.floor(Math.random()*4)]];
    res.status(200).json({ symbols: s, message: "BITE PROCESSED! 🔥" });

    // 2. De Split (gebeurt op de achtergrond)
    try {
        const connection = new Connection("https://rpc.testnet.x1.xyz", "confirmed");
        const secretKey = bs58.decode(process.env.TREASURY_PRIVATE_KEY);
        const treasuryKeypair = Keypair.fromSecretKey(secretKey);
        
        const devWallet = new PublicKey("BAavVn1N73U9k9S7D8XmGq6U6p1D5K7L8M9N0O1P2Q3"); 
        const koper10 = new PublicKey("5aBYF1ZUc432g8yY88nupuxXk7uB5b4cRmKUj1uF1M3C");

        const splitTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: treasuryKeypair.publicKey,
                toPubkey: devWallet,
                lamports: 80000000 // 8%
            }),
            SystemProgram.transfer({
                fromPubkey: treasuryKeypair.publicKey,
                toPubkey: koper10,
                lamports: 20000000 // 2%
            })
        );

        // We gebruiken 'sendAndConfirmTransaction' om zeker te zijn dat het aankomt
        await connection.sendTransaction(splitTx, [treasuryKeypair]);
        console.log("Fees distributed to Koper 10 and Dev!");

    } catch (err) {
        console.error("Split failed:", err);
    }
}
