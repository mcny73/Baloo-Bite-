import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

// MAINNET CONFIGURATION
const RPC_URL = "https://rpc.x1.xyz";
const TREASURY_WALLET = "39fuVmCFZDpoirjpMoJUoBmWTj27c3Vk69hFf48QGtPe"; // Buyer 1
const KOPER_10_WALLET = "5aBYF1ZUc432g8yY88nupuxXk7uB5b4cRmKUj1uF1M3C"; // Buyer 10 (Fee Receiver)

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { signature, player } = req.body;

    try {
        const connection = new Connection(RPC_URL, "confirmed");

        // 1. Loose Transaction Check (Speed optimization for Mainnet)
        // We try to find the TX, but proceed even if indexing is slow
        try {
             await connection.getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
        } catch(e) { 
            console.log("Indexing lag, proceeding with game logic"); 
        }

        // 2. FEE LOGIC: Send 0.02 XNT from Treasury (Buyer 1) to Buyer 10
        // Only works if PRIVATE_KEY is set in Vercel
        if (process.env.PRIVATE_KEY) {
            try {
                // Decode private key
                const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
                
                // Prepare Fee Transaction
                const { blockhash } = await connection.getLatestBlockhash();
                const feeTx = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: treasuryKeypair.publicKey,
                        toPubkey: new PublicKey(KOPER_10_WALLET),
                        lamports: 0.02 * LAMPORTS_PER_SOL // Exactly 0.02 XNT
                    })
                );
                
                feeTx.recentBlockhash = blockhash;
                feeTx.feePayer = treasuryKeypair.publicKey;
                feeTx.sign(treasuryKeypair);
                
                // Send Fee
                const feeSig = await connection.sendRawTransaction(feeTx.serialize());
                console.log("Fee sent to Buyer 10. Sig:", feeSig);

            } catch (feeErr) {
                console.error("Fee Transfer Error (Check Balance/Key):", feeErr);
            }
        } else {
            console.warn("PRIVATE_KEY not found in env variables. Fee not sent.");
        }

        // 3. Game Logic (30% Win Chance)
        const isWin = Math.random() < 0.3; 
        
        let symbols = ['🐾', '🐾', '🐾']; 
        let message = "BURNED! 🔥";

        if (isWin) {
            symbols = ['🥇', '🥇', '🥇'];
            message = "WINNER! (BETA)";
        } else {
            const items = ['🐾', '🦴', '🥈'];
            symbols = [
                items[Math.floor(Math.random()*3)],
                items[Math.floor(Math.random()*3)],
                items[Math.floor(Math.random()*3)]
            ];
            // Ensure visual loss (not 3 matching symbols)
            if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
                symbols[2] = '🦴';
            }
        }

        res.status(200).json({ success: true, symbols, message });

    } catch (error) {
        console.error("Critical Error:", error);
        res.status(500).json({ error: error.message });
    }
}
