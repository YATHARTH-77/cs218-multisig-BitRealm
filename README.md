# 🔐 CS 218: BitRealm Multi-Signature Wallet

## 👥 Team Members
1. **Yatharth Maurya** - 240001082
2. **Tanishq Dhari** - 240001072
3. **Abhiroop Gohar** - 240051002
4. **Aarush Pravin Bindod** - 240051001
5. **Adharsh Gopalakrishnan** - 240002004
6. **Harsithkumar Singh** - 240002027

---

## 📖 Project Overview
This repository contains a secure, gas-optimized Smart Contract backend and a Next.js frontend for an N-of-M Multi-Signature Wallet. The contract enables multiple authorized owners to manage funds collectively, requiring a predefined threshold of approvals before any transaction can be executed. 

The backend is built using **Hardhat v3 (ESM)** and utilizes **Hardhat Ignition** for declarative, state-tracked deployments.

### ⚡ Technical Highlights
- **Security First:** Implements OpenZeppelin's `ReentrancyGuard` and the Checks-Effects-Interactions (CEI) pattern to prevent reentrancy attacks during external calls.
- **Gas Efficiency:** Utilizes EVM storage slot packing by downsizing struct members (e.g., packing a `uint8` for approval counts alongside a `bool`) to reduce `SSTORE` operational costs.
- **Documentation:** 100% NatSpec coverage (`@notice`, `@param`, `@return`) on all public-facing functions.
- **Testing:** 100% Line Coverage across all smart contracts.

---

## 🌍 Environment Architecture (Live vs. Local)

To maintain a professional CI/CD pipeline and make evaluation as seamless as possible, this repository is split into two completely isolated environments via Git branches. 

* 🌿 **`main` branch (Local Sandbox):** This default branch is pre-configured for local Hardhat testing. It connects the frontend to a local simulated EVM.
* 🚀 **`live-production` branch (Global Testnet):** This branch powers the globally deployed Vercel application. It connects directly to the Ethereum Sepolia testnet.

---

## 🔑 Grader Credentials & Pre-Funded Accounts

To evaluate the Owner-only functionality of the BitRealm Multi-Sig Vault, you will need to import specific private keys into your MetaMask wallet. 

Please refer to the provided **`PRIVATE_CREDENTIALS.txt`** file (or the secure Google Drive link: 👉 **[INSERT_YOUR_GOOGLE_DRIVE_LINK_HERE]**). The file contains two sets of keys:

1. **Environment 1: Local Sandbox Keys (`main` branch)**
   * **Network:** Localhost 8545
   * **Context:** These are standard Hardhat deterministic accounts to be used when running the local node. 
2. **Environment 2: Live Production Keys (`live-production` branch)**
   * **Network:** Sepolia Testnet
   * **Context:** These are burner wallets pre-funded with Sepolia ETH. You can use these to test the live Vercel deployment without needing to source your own testnet funds.

> ⚠️ **SECURITY NOTE:** The Sepolia accounts are expendable burner wallets created strictly for grading purposes. No mainnet funds or personal assets are associated with these keys.

---

## 💻 Option 1: Evaluate the Live Production Build
The application is live on the Ethereum Sepolia testnet.
* **Live Web App:** **[INSERT VERCEL LINK HERE]**
* **Verified Smart Contract:** **[INSERT BLOCKSCOUT LINK HERE]**
* **Source Code:** Switch to the `live-production` branch in this repository.

**How to test:** Open the Vercel link. You can view the dashboard as a "Guest" to see the global state of the contract. To propose, approve, or execute transactions, please use the **Live Sepolia** Private Keys to log into your MetaMask.

---

## 🛠 Option 2: Local Setup & Development (This Branch)

If you wish to evaluate the mathematical security, gas optimizations, or run the architecture locally from scratch, this `main` branch is pre-configured for your local machine.

**1. Install Dependencies:**
```bash
npm install

2. **Compile the contract:**
   
   ```bash
   npx hardhat build
   ```
3. **Run the tests:**

   ```bash
   npx hardhat test
   ```
4. **View the gas report:**

   ```bash
   npx hardhat test --gas-stats
   ```
5. **View the coverage:**

   ```bash
   npx hardhat test --coverage
   ```
6. **Deploy to a persistent local network:**

   ```bash
   npx hardhat node
   ```
   and then in another terminal

   ```bash
   npx hardhat ignition deploy ignition/modules/MultiSigWallet.ts --network localhost
   ```
   in same 2nd terminal after above command
   ```bash
   npx hardhat run scripts/fund.ts --network localhost
   ```
