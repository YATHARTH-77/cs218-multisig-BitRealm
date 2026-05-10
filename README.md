<div align="center">

```
██████╗ ██╗████████╗██████╗ ███████╗ █████╗ ██╗     ███╗   ███╗
██╔══██╗██║╚══██╔══╝██╔══██╗██╔════╝██╔══██╗██║     ████╗ ████║
██████╔╝██║   ██║   ██████╔╝█████╗  ███████║██║     ██╔████╔██║
██╔══██╗██║   ██║   ██╔══██╗██╔══╝  ██╔══██║██║     ██║╚██╔╝██║
██████╔╝██║   ██║   ██║  ██║███████╗██║  ██║███████╗██║ ╚═╝ ██║
╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝
```

<h1>⬡ Multi-Signature Vault</h1>
<h3><em>CS 218 · Collective Trust, Onchain</em></h3>

<br/>

[![Solidity](https://img.shields.io/badge/Solidity-0.8.x-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-v3_ESM-f7d863?style=for-the-badge&logo=hardhat&logoColor=black)](https://hardhat.org/)
[![Next.js](https://img.shields.io/badge/Next.js-Frontend-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-Security-4E5EE4?style=for-the-badge&logo=openzeppelin&logoColor=white)](https://openzeppelin.com/)
[![Coverage](https://img.shields.io/badge/Test_Coverage-100%25-00c853?style=for-the-badge)](/)
[![Network](https://img.shields.io/badge/Testnet-Sepolia-627EEA?style=for-the-badge&logo=ethereum&logoColor=white)](https://sepolia.etherscan.io/)

<br/>

> **An N-of-M multi-signature wallet where no single key holds the kingdom.**  
> Every transaction requires collective consensus — secure, gas-optimized, and fully on-chain.

<br/>

---

</div>

## 👥 Team

<table>
<tr>
<td align="center"><b>Yatharth Maurya</b><br/><code>240001082</code></td>
<td align="center"><b>Tanishq Dhari</b><br/><code>240001072</code></td>
<td align="center"><b>Abhiroop Gohar</b><br/><code>240051002</code></td>
</tr>
<tr>
<td align="center"><b>Aarush Pravin Bindod</b><br/><code>240051001</code></td>
<td align="center"><b>Adharsh Gopalakrishnan</b><br/><code>240002004</code></td>
<td align="center"><b>Harsithkumar Singh</b><br/><code>240002027</code></td>
</tr>
</table>

---

## 📖 Project Overview

This repository contains a **secure, gas-optimized Smart Contract backend** and a **Next.js frontend** for an N-of-M Multi-Signature Wallet. The contract enables multiple authorized owners to manage funds collectively, requiring a predefined threshold of approvals before any transaction can be executed.

The backend is built using **Hardhat v3 (ESM)** and utilizes **Hardhat Ignition** for declarative, state-tracked deployments.

---

## ⚡ Technical Highlights

<table>
<tr>
<td width="50%">

### 🛡️ Security First
Implements OpenZeppelin's `ReentrancyGuard` and the **Checks-Effects-Interactions (CEI)** pattern to prevent reentrancy attacks during external calls.

</td>
<td width="50%">

### ⛽ Gas Efficiency
Utilizes EVM **storage slot packing** by downsizing struct members (e.g., packing a `uint8` for approval counts alongside a `bool`) to reduce `SSTORE` operational costs.

</td>
</tr>
<tr>
<td width="50%">

### 📝 Documentation
**100% NatSpec coverage** — `@notice`, `@param`, `@return` — on all public-facing functions.

</td>
<td width="50%">

### ✅ Testing
**100% Line Coverage** across all smart contracts, verified via Hardhat's coverage tool.

</td>
</tr>
</table>

---

## 🌍 Environment Architecture

To maintain a professional CI/CD pipeline and make evaluation seamless, this repository is split into **two completely isolated environments** via Git branches.

```
┌─────────────────────────────────────────────────────────────────┐
│                     BITREALM ARCHITECTURE                       │
├────────────────────────────┬────────────────────────────────────┤
│  🌿  main  branch          │  🚀  live-production  branch       │
│  ─────────────────────     │  ───────────────────────────────   │
│  Local Sandbox             │  Global Testnet                    │
│  Hardhat simulated EVM     │  Ethereum Sepolia Testnet          │
│  For local dev & testing   │  Powers live Vercel deployment     │
└────────────────────────────┴────────────────────────────────────┘
```

| Branch | Environment | Network | Purpose |
|--------|------------|---------|---------|
| 🌿 `main` | Local Sandbox | Localhost 8545 | Development, testing, evaluation |
| 🚀 `live-production` | Global Testnet | Ethereum Sepolia | Live Vercel app |

---

## 🔑 Grader Credentials & Pre-Funded Accounts

To evaluate Owner-only functionality, import specific private keys into your MetaMask wallet from the PRIVATE_CREDENTIALS.txt.

> 📄 Refer to **`PRIVATE_CREDENTIALS.txt`** which is present in the secure Google Drive link:  
> 👉 **https://drive.google.com/drive/u/0/folders/19spfhhuWcdehtSJYV9rSDSoE3-bISsr3**
>
> 🎬 **Demo Videos** (also available on the same Google Drive):
> - 📹 **Local Sandbox Demo** — Full walkthrough of the app running locally on Hardhat
> - 📹 **Live Deployed Demo** — Full walkthrough of the live Vercel + Sepolia deployment

### Environment 1 — Local Sandbox Keys (`main` branch)

| Key | Value |
|-----|-------|
| **Network** | Localhost 8545 |
| **Context** | Standard Hardhat deterministic accounts for local node |

### Environment 2 — Live Production Keys (`live-production` branch)

| Key | Value |
|-----|-------|
| **Network** | Sepolia Testnet |
| **Context** | Burner wallets pre-funded with Sepolia ETH |

> [!WARNING]
> **SECURITY NOTE:** The Sepolia accounts are **expendable burner wallets** created strictly for grading purposes. No mainnet funds or personal assets are associated with these keys.

---

## 🚀 Option 1: Evaluate the Live Production Build

The application is **live on the Ethereum Sepolia testnet**.

| Resource | Link |
|----------|------|
| 🌐 Live Web App | **https://cs218-multisig-bit-realm-dyrr5roj1-yatharth-mauryas-projects.vercel.app/** |
| 🔍 Verified Smart Contract | **https://eth-sepolia.blockscout.com/address/0x90a33DfA3FDbFC86C116f63E097a1558cc1D783d** |
| 📂 Source Code | Switch to the `live-production` branch |

**How to test:**
1. Open the Vercel link — view the dashboard as a **"Guest"** to see the global contract state
2. To propose, approve, or execute transactions → import the **Live Sepolia** private keys into MetaMask
3. Select the **Sepolia** network and interact directly with the deployed contract

---

## 🛠️ Option 2: Local Setup & Development

> This `main` branch is pre-configured for local machine evaluation — ideal for auditing mathematical security, gas optimizations, and full architecture walkthrough.

### Step 1 — Install Dependencies

```bash
npm install
```

### Step 2 — Compile the Contract

```bash
npx hardhat build
```

### Step 3 — Run the Test Suite

```bash
npx hardhat test
```

### Step 4 — View Gas Report

```bash
npx hardhat test --gas-stats
```

### Step 5 — View Coverage Report

```bash
npx hardhat test --coverage
```

### Step 6 — Deploy to Persistent Local Network

**Terminal 1** — Start the local node:
```bash
npx hardhat node
```

**Terminal 2** — Deploy the contract:
```bash
npx hardhat ignition deploy ignition/modules/MultiSigWallet.ts --network localhost
```

**Terminal 2** — Fund the contract:
```bash
npx hardhat run scripts/fund.ts --network localhost
```

---

<div align="center">

**Built with ⬡ for CS 218**

*No single key holds the kingdom — only consensus does.*

</div>