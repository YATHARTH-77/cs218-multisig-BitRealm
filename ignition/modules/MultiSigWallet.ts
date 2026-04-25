import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MultiSigWalletModule", (m) => {
  // Your 3 REAL MetaMask addresses go here
  const OWNERS = [
    "0xFcF8bE0f7B50268678231dB7eE38c7c3dB74cd3c",// Owner 1 (You)
    "0x5a6c9C9CE4EbBE059DE63CEEE4efCDBf3335F83e",// Owner 2
    "0x8Df8389C942dc3fADBF586BF8CC7b04538aA13Bd" // Owner 3
  ];

  const THRESHOLD = 2;

  const multiSig = m.contract("MultiSigWallet", [OWNERS, THRESHOLD]);

  return { multiSig };
});