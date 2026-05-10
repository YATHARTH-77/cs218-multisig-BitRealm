import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MultiSigWalletModule", (m) => {
  
  const owner1 = m.getAccount(0);
  const owner2 = m.getAccount(1);
  const owner3 = m.getAccount(2);

  const owners = [owner1, owner2, owner3];
  const requiredApprovals = 2n; 

  const multiSig = m.contract("MultiSigWallet", [owners, requiredApprovals]);

  return { multiSig };
});