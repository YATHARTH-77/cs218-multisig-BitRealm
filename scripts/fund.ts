import hre from "hardhat";

async function main() {
  const network = await hre.network.getOrCreate();
  const ethers = network.ethers;
  
  const [a] = await ethers.getSigners();
  
  // Fund the contract with 10 ETH
  const tx = await a.sendTransaction({
    to: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    value: ethers.parseEther("10")
  });
  await tx.wait();
  
  const balance = await ethers.provider.getBalance("0x5FbDB2315678afecb367f032d93F642f64180aa3");
  console.log("Contract balance:", ethers.formatEther(balance), "ETH");
}

main().catch(console.error);