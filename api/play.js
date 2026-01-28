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
        const koper10_BurnWallet = new PublicKey("4fVpY8vMvVzT9uR7nJ3xL5k2H1g9f8D7s6A5S4D3F2G1"); // Koper 10

        const betAmount = 1000000000; // 1 XNT
        const devFee = betAmount * 0.08;
        const burnFee = betAmount * 0.02;

        // EXECUTE AUTOMATED DISTRIBUTION
        const feeTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: treasuryKeypair.publicKey,
                toPubkey: devWallet,
                lamports: devFee,
            }),
            SystemProgram.transfer({
                fromPubkey: treasuryKeypair.publicKey,
                toPubkey: koper10_BurnWallet,
                lamports: burnFee,
            })
        );
        
        const feeSig = await connection.sendTransaction(feeTx, [treasuryKeypair]);

        // GAME LOGIC
        const reels = ['🐾', '🦴', '🥈', '🥇'];
        const s1 = reels[Math.floor(Math.random() * reels.length)];
        const s2 = reels[Math.floor(Math.random() * reels.length)];
        const s3 = reels[Math.floor(Math.random() * reels.length)];
        
        let winAmount = 0;
        let message = "BET LOST - $BALOO BURNED! 🔥";

        if (s1 === s2 && s2 === s3) {
            if (s1 === '🥇') { winAmount = betAmount * 50; message = "JACKPOT! 50X WIN!"; }
            else if (s1 === '🦴') { winAmount = betAmount * 10; message = "BIG BITE! 10X WIN!"; }
            else { winAmount = betAmount * 2; message = "NICE! 2X WIN!"; }
        }

        if (winAmount > 0) {
            const payTx = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: treasuryKeypair.publicKey,
                    toPubkey: new PublicKey(player),
                    lamports: winAmount,
                })
            );
            await connection.sendTransaction(payTx, [treasuryKeypair]);
        }

        res.status(200).json({
            symbols: [s1, s2, s3],
            message: message,
            burnDetail: `2% $BALOO Buy-back sent to Koper 10! 🔥`,
            tx: feeSig
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
