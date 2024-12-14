import { mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { useState, useEffect } from "react";
import styles from "./Wallet.module.css";

const SOLANA_RPC_URL =
  "https://solana-mainnet.g.alchemy.com/v2/DNsKW_5-xvsmoLeQBBCpkdmFLXisCNrX";
const SOL_TO_USD_API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";

export function SolanaWallet({ mnemonic }: { mnemonic: string }) {
  const [currentIndex, setCurrentIndex] = useState<number>(Number(localStorage.getItem('sol-idx')));
  const [wallets, setWallets] = useState<
    { publicKey: string; balanceSOL: number; balanceUSD: number }[]
  >(JSON.parse(localStorage.getItem('sol-wallets') || '[]'));
  const [loading, setLoading] = useState<boolean>(false);
  const [showUSD, setShowUSD] = useState(false); // Toggle between USD and SOL
  const [solToUsdRate, setSolToUsdRate] = useState<number>(0);

  // Fetch SOL to USD conversion rate
  useEffect(() => {
    async function fetchSolToUsd() {
      try {
        const response = await fetch(SOL_TO_USD_API_URL);
        const data = await response.json();
        setSolToUsdRate(data.solana.usd); // Set the rate of SOL to USD
      } catch (error) {
        console.error("Error fetching SOL to USD rate:", error);
      }
    }
    fetchSolToUsd();
  }, []);

  // Generate Solana Wallet and Fetch Balance
  async function generateWallet() {
    try {
      setLoading(true);

      const seed = await mnemonicToSeed(mnemonic);
      const path = `m/44'/501'/${currentIndex}'/0'`;
      const derivedSeed = derivePath(path, seed.toString("hex")).key;
      const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
      const keypair = Keypair.fromSecretKey(secret);
      const publicKey = keypair.publicKey.toBase58();

      const connection = new Connection(SOLANA_RPC_URL);
      const balance = await connection.getBalance(new PublicKey(publicKey));
      const balanceInSOL = balance / 1e9; // Convert lamports to SOL
      const balanceInUSD = balanceInSOL * solToUsdRate; // Convert SOL to USD
      localStorage.setItem('sol-wallets', JSON.stringify([...wallets, { publicKey, balanceSOL: balanceInSOL, balanceUSD: balanceInUSD }]));
      setWallets([...wallets, { publicKey, balanceSOL: balanceInSOL, balanceUSD: balanceInUSD }]);
      localStorage.setItem('sol-idx', (currentIndex + 1).toString());
      setCurrentIndex(currentIndex + 1);

    } catch (error) {
      console.error("Failed to generate wallet:", error);
    } finally {
      setLoading(false);
    }
  }

  // Copy Public Key to Clipboard
  function copyToClipboard(key: string) {
    navigator.clipboard.writeText(key);
    alert("Public Key copied to clipboard!");
  }

  return (
    <div className={styles.walletContainer}>
      <button
        onClick={generateWallet}
        className={styles.addButton}
        disabled={loading}
      >
        {loading ? "Generating Wallet..." : "Add SOL Wallet"}
      </button>

      <div className={styles.walletList}>
        {wallets.map((wallet, index) => (
          <div key={index} className={styles.walletCard}>
            <h3>Solana Wallet #{index + 1}</h3>
            <div className={styles.walletInfo}>
              <p>
                <strong>Public Key:</strong>{" "}
                <span className={styles.keyText}>{wallet.publicKey}</span>
                <button
                  onClick={() => copyToClipboard(wallet.publicKey)}
                  className={styles.copyButton}
                >
                  📋 Copy
                </button>
              </p>
              <p>
                <strong>Balance:</strong>{" "}
                <span className={styles.balanceText}>
                  {showUSD ? `$${wallet.balanceUSD.toFixed(2)}` : `${wallet.balanceSOL} SOL`}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowUSD(!showUSD)}
        className={styles.toggleButton}
      >
        {showUSD ? "View in SOL" : "View in USD"}
      </button>
    </div>
  );
}
