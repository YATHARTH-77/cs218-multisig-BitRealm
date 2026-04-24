# CS 218 : Multi-Signature Wallet

## Team Members
1. Tanishq Dhari - 240001072
2. Aarush Pravin Bindod - 240051001
3. Abhiroop Gohar - 240051002
4. Yatharth Maurya - 240001082
5. Adharsh Gopalakrishnan - 240002004
6. Harsithkumar Singh - 240002027

## Project Overview
This repository contains a secure, gas-optimized Smart Contract backend for an N-of-M Multi-Signature Wallet. The contract enables multiple authorized owners to manage funds collectively, requiring a predefined threshold of approvals before any transaction can be executed. 

The project is built using **Hardhat v3 (ESM)** and utilizes **Hardhat Ignition** for declarative, state-tracked deployments.

## Technical Highlights
- **Security:** Implements OpenZeppelin's `ReentrancyGuard` and the Checks-Effects-Interactions (CEI) pattern to prevent reentrancy attacks during external calls.
- **Gas Efficiency:** Utilizes EVM storage slot packing by downsizing struct members (e.g., `uint8` for approval counts) to reduce `SSTORE` costs.
- **Documentation:** 100% NatSpec coverage (@notice, @param, @return) on all public-facing functions.
- **Testing:** 100% Line Coverage across all smart contracts.

## Local Setup & Development

1. **Install Dependencies:**

   ```bash
   npm install
   ```
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
