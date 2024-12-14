import { useState, useEffect } from "react";
import { generateMnemonic } from "bip39";
import { SolanaWallet } from "./SolanaWallet";
import { EthWallet } from "./EthWallet";
import styles from "./App.module.css";

function App() {
  const [mnemonic, setMnemonic] = useState<string>(
    localStorage.getItem("wallet-mnemonic") || ""
  );
  const [activeTab, setActiveTab] = useState<"solana" | "ethereum">("solana");
  const [password, setPassword] = useState<string>("");
  const [isPasswordSet, setIsPasswordSet] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Check if password is set in localStorage
  useEffect(() => {
    const storedPassword = localStorage.getItem("walletPassword");
    if (storedPassword) {
      setIsPasswordSet(true);
    }
  }, []);

  // Generate Mnemonic Seed Phrase
  async function genSeedPhrase() {
    const mn: string = generateMnemonic();
    localStorage.setItem("wallet-mnemonic", mn);
    setMnemonic(mn);
  }

  // Handle Password Creation
  const handleCreatePassword = () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    localStorage.setItem("walletPassword", password); // Save password to localStorage
    setIsPasswordSet(true);
    setIsLoggedIn(true);
  };

  // Handle Login with Password
  const handleLogin = () => {
    const storedPassword = localStorage.getItem("walletPassword");
    if (storedPassword === password) {
      setIsLoggedIn(true);
      setError(""); // Clear error if login is successful
    } else {
      setError("Incorrect password.");
    }
  };

  const handleCopy = () => {
    if (mnemonic) {
      navigator.clipboard
        .writeText(mnemonic)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000); // Hide "Copied" after 2 seconds
        })
        .catch((error) => {
          console.error("Failed to copy:", error);
        });
    }
  };

  return (
    <div className={styles.appContainer}>
      <h1 className={styles.title}>My Multi-Chain Wallet</h1>

      {/* Password Setup or Login */}
      {!isLoggedIn && (
        <div className={styles.passwordContainer}>
          {isPasswordSet ? (
            <div>
              <h2>Login to Your Wallet</h2>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.passwordInput}
                placeholder="Enter your password"
              />
              <button onClick={handleLogin} className={styles.loginBtn}>
                Login
              </button>
            </div>
          ) : (
            <div>
              <h2>Create a Password</h2>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.passwordInput}
                placeholder="Create your password"
              />
              <button
                onClick={handleCreatePassword}
                className={styles.createBtn}
              >
                Create Password
              </button>
            </div>
          )}
          {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
      )}

      {/* Seed Phrase Generator */}
      {isLoggedIn && (
        <div>
          <div className={styles.seedContainer}>
            <input
              type="text"
              value={mnemonic}
              readOnly
              className={styles.seedInput}
              placeholder="Your seed phrase will appear here..."
              onClick={handleCopy}
            />

            <button
              disabled={mnemonic.length > 0}
              onClick={genSeedPhrase}
              className={`${styles.generateBtn} ${
                mnemonic.length > 0 ? styles.disabledBtn : ""
              }`}
            >
              Generate Seed Phrase
            </button>
            {copied && <span className="copiedMessage">Copied!</span>}
          </div>

          {/* Tabs for Solana & Ethereum */}
          {mnemonic && (
            <div>
              <div className={styles.tabHeader}>
                <button
                  className={`${styles.tabButton} ${
                    activeTab === "solana" ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveTab("solana")}
                >
                  Solana Wallet
                </button>
                <button
                  className={`${styles.tabButton} ${
                    activeTab === "ethereum" ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveTab("ethereum")}
                >
                  Ethereum Wallet
                </button>
              </div>

              {/* Wallet View */}
              <div className={styles.tabContent}>
                {activeTab === "solana" && <SolanaWallet mnemonic={mnemonic} />}
                {activeTab === "ethereum" && <EthWallet mnemonic={mnemonic} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
