import { useState } from "react";
import { mnemonicToSeed } from "bip39";
import { Wallet, HDNodeWallet, JsonRpcProvider, formatEther } from "ethers";
import styles from "./Wallet.module.css";

const ETH_RPC_URL =
  "https://eth-mainnet.g.alchemy.com/v2/DNsKW_5-xvsmoLeQBBCpkdmFLXisCNrX";

export const EthWallet = ({ mnemonic }: { mnemonic: string }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(
    Number(localStorage.getItem("eth-idx"))
  );
  const [wallets, setWallets] = useState<
    { address: string; balance: string }[]
  >(JSON.parse(localStorage.getItem("eth-wallets") || "[]"));
  const [loading, setLoading] = useState<boolean>(false);

  // Generate Ethereum Wallet and Fetch Balance
  async function generateEthWallet() {
    try {
      setLoading(true);

      // Convert mnemonic to seed
      const seed = await mnemonicToSeed(mnemonic);

      // Derivation path and HD Node creation
      const derivationPath = `m/44'/60'/${currentIndex}'/0'`;
      const hdNode = HDNodeWallet.fromSeed(seed);
      const child = hdNode.derivePath(derivationPath);
      const wallet = new Wallet(child.privateKey);
      const address = wallet.address;

      // Fetch balance
      const provider = new JsonRpcProvider(ETH_RPC_URL);
      const balance = await provider.getBalance(address);
      const balanceInETH = formatEther(balance);

      // Update wallet state
      localStorage.setItem(
        "eth-wallets",
        JSON.stringify([...wallets, { address, balance: balanceInETH }])
      );
      setWallets((prevWallets) => [
        ...prevWallets,
        { address, balance: balanceInETH },
      ]);
      localStorage.setItem("eth-idx", (currentIndex + 1).toString());
      setCurrentIndex((prevIndex) => prevIndex + 1);
    } catch (error) {
      console.error("Failed to generate wallet:", error);
    } finally {
      setLoading(false);
    }
  }

  // Copy Ethereum Address to Clipboard
  function copyToClipboard(address: string) {
    navigator.clipboard.writeText(address);
    alert("Ethereum Address copied to clipboard!");
  }

  return (
    <div className={styles.walletContainer}>
      <button
        onClick={generateEthWallet}
        className={styles.addButton}
        disabled={loading}
      >
        {loading ? "Generating Wallet..." : "Add ETH Wallet"}
      </button>

      <div className={styles.walletList}>
        {wallets.map((wallet, index) => (
          <div key={index} className={styles.walletCard}>
            <h3>Ethereum Wallet #{index + 1}</h3>
            <div className={styles.walletInfo}>
              <p>
                <strong>Address:</strong>{" "}
                <span className={styles.keyText}>{wallet.address}</span>
                <button
                  onClick={() => copyToClipboard(wallet.address)}
                  className={styles.copyButton}
                >
                  📋 Copy
                </button>
              </p>
              <p>
                <strong>Balance:</strong>{" "}
                <span className={styles.balanceText}>{wallet.balance} ETH</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
