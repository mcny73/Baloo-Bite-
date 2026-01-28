import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { signature, player } = req.body;
    const DEV_WALLET = "BAavP6nxHDkVDowYXoyDaNDbc9CAgncfDPELAyjzoyTq";
    const TREASURY_PUBKEY = "39fuVmCFZDpoirjpMoJUoBmWTj27c3Vk69hFf48QGtPe";
    const X1_RPC = "https://rpc.testnet.x1.xyz";
    const connection = new Connection(X1_RPC, "confirmed");

    try {
        // 1. RNG - The Roll (1 to 1000)
        const roll = Math.floor(Math.random() * 1000) + 1;
        let winMultiplier = 0;
        let symbols = ['🐾', '🦴', '🥈']; // Default lose set
        let message = "NO LUCK THIS TIME!";

        if (roll === 777) { // JACKPOT (1/1000)
            winMultiplier = 50; 
            symbols = ['🥇', '🥇', '🥇'];
            message = "!!! JACKPOT !!!";
        } else if (roll <= 200) { // BREAK EVEN (1/5)
            winMultiplier = 1;
            symbols = ['🐾', '🐾', '🐾'];
            message = "BREAK EVEN!";
        } else if (roll <= 280) { // 2X WIN (1/12)
            winMultiplier = 2;
            symbols = ['🦴', '🦴', '🦴'];
            message = "2X WIN! NICE!";
        } else if (roll <= 300) { // 10X WIN (1/50)
            winMultiplier = 10;
            symbols = ['🥈', '🥈', '🥈'];
            message = "SILVER BITE! 10X!";
        }

        // 2. DISTRIBUTION & PAYOUT
        const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(process.env.TREASURY_PRIVATE_KEY));
        const splitTx = new Transaction();
        
        // 8% to Dev Wallet
        splitTx.add(SystemProgram.transfer({
            fromPubkey: treasuryKeypair.publicKey,
            toPubkey: new PublicKey(DEV_WALLET),
            lamports: 80000000 // 0.08 XNT
        }));

        // 2% to SVM Burn Address
        splitTx.add(SystemProgram.transfer({
            fromPubkey: treasuryKeypair.publicKey,
            toPubkey: new PublicKey("11111111111111111111111111111111"),
            lamports: 20000000 // 0.02 XNT
        }));

        // If win -> Pay the player
        if (winMultiplier > 0) {
            splitTx.add(SystemProgram.transfer({
                fromPubkey: treasuryKeypair.publicKey,
                toPubkey: new PublicKey(player),
                lamports: winMultiplier * 1000000000
            }));
        }

        const { blockhash } = await connection.getLatestBlockhash();
        splitTx.recentBlockhash = blockhash;
        splitTx.feePayer = treasuryKeypair.publicKey;
        splitTx.sign(treasuryKeypair);
        
        await connection.sendRawTransaction(splitTx.serialize());

        res.status(200).json({ symbols, message, winMultiplier });

    } catch (err) {
        console.error("Backend Error:", err);
        res.status(500).json({ error: "Processing failed", symbols: ['❌','❌','❌'], message: "RETRY LATER" });
    }
}
