import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MultiSigWalletModule", (m) => {
  // Define the exact MetaMask addresses of your owners.
  const OWNERS = [
    "0xFcF8bE0f7B50268678231dB7eE38c7c3dB74cd3c",          // Owner 1 (Your Sepolia Deployer)
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Owner 2 (Dummy testnet address)
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"  // Owner 3 (Dummy testnet address)
  ];

  // Set the M-of-N threshold
  const THRESHOLD = 2;

  // Deploy the contract with these exact arguments
  const multiSig = m.contract("MultiSigWallet", [OWNERS, THRESHOLD]);

  return { multiSig };
});