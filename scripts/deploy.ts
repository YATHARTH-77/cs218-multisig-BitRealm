import { ethers } from "hardhat";

async function main() {
    console.log("Igniting deployment sequence...");

    // 1. Grab our test accounts from Hardhat
    const signers = await ethers.getSigners();
    
    // We will extract the first 3 addresses to act as our wallet "Owners"
    const owners = [signers[0].address, signers[1].address, signers[2].address];
    
    // We require 2 out of 3 owners to approve any transaction
    const requiredApprovals = 2; 

    // 2. Deploy the Multi-Sig Wallet
    console.log("\nDeploying MultiSigWallet...");
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const multiSig = await MultiSigWallet.deploy(owners, requiredApprovals);
    await multiSig.waitForDeployment();
    
    const multiSigAddress = await multiSig.getAddress();
    console.log(`✅ MultiSigWallet deployed to: ${multiSigAddress}`);
    console.log(`👉 Owners: ${owners.join(", ")}`);
    console.log(`👉 Required Approvals: ${requiredApprovals}`);

    // 3. Deploy the Counter Contract (Our Target)
    console.log("\nDeploying Counter Contract...");
    const Counter = await ethers.getContractFactory("Counter");
    const counter = await Counter.deploy();
    await counter.waitForDeployment();
    
    const counterAddress = await counter.getAddress();
    console.log(`✅ Counter deployed to: ${counterAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});