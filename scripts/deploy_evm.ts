import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY missing in .env");

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const deployer = new ethers.Wallet(privateKey, provider);
  
  const network = await provider.getNetwork();
  console.log(`\nInitializing EVM deployment on Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deploying from account: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH\n`);

  console.log("Compiling & Deploying DirectMessageEvm.sol...");
  const artifact = await hre.artifacts.readArtifact("DirectMessageEvm");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("\n✅ Deployment Successful!");
  console.log(`🎯 DirectMessageEvm deployed to: ${address}`);
  console.log(`🔍 View on Explorer: https://sepolia.etherscan.io/address/${address}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
