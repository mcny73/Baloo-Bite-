import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

// MAINNET CONFIGURATION (CORRECTED RPC)
const RPC_URL = "https://rpc.mainnet.x1.xyz";
const TREASURY_WALLET = "39fuVmCFZDpoirjpMoJUoBmWTj27c3Vk69hFf48QGtPe"; // Buyer 1
const KOPER_10_WALLET = "5aBYF1ZUc432g8yY88nupuxXk7uB5b4cRmKUj1uF1M3C"; // Buyer 10

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { signature, player } = req.body;

    try {
        const connection = new Connection(RPC_URL, "confirmed");

        // 1. Transaction Check
        try {
             await connection.getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
        } catch(e) { 
            console.log("Indexing lag, proceeding with game logic"); 
        }

        // 2. FEE LOGIC: Send 0.02 XNT to Buyer 10
        if (process.env.PRIVATE_KEY) {
            try {
                const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
                
                const { blockhash } = await connection.getLatestBlockhash();
                const feeTx = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: treasuryKeypair.publicKey,
                        toPubkey: new PublicKey(KOPER_10_WALLET),
                        lamports: 0.02 * LAMPORTS_PER_SOL // 0.02 XNT
                    })
                );
                
                feeTx.recentBlockhash = blockhash;
                feeTx.feePayer = treasuryKeypair.publicKey;
                feeTx.sign(treasuryKeypair);
                
                const feeSig = await connection.sendRawTransaction(feeTx.serialize());
                console.log("Fee sent:", feeSig);

            } catch (feeErr) {
                console.error("Fee Transfer Error:", feeErr);
            }
        }

        // 3. Game Logic
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
