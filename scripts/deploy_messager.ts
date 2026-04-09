import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const url = "https://testnet.coti.io/rpc";
  const provider = new ethers.JsonRpcProvider(url);
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is missing in your .env file.");
  }

  // Double-checking the network
  const network = await provider.getNetwork();
  console.log(`\nInitializing deployment on Network: ${network.name} (Chain ID: ${network.chainId})`);
  
  if (network.chainId !== 7082400n) {
    console.warn("⚠️ Warning: You are not connected to the COTI Testnet. Please run with `--network cotiTestnet`");
  }

  console.log(`Deploying from account: ${deployer.address}`);

  const balance = await provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} COTI\n`);

  console.log("Compiling & Deploying DirectMessage.sol...");

  // Load the compiled artifact
  const artifact = await hre.artifacts.readArtifact("DirectMessage");
  const DirectMessage = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  // Deploy the contract without arguments (as there are no params in our constructor)
  const directMessage = await DirectMessage.deploy();
  
  // Wait for block confirmations
  await directMessage.waitForDeployment();

  const deployedAddress = await directMessage.getAddress();
  
  console.log("\n✅ Deployment Successful!");
  console.log(`🎯 Contract deployed to: ${deployedAddress}`);
  console.log(`🔍 View on Explorer: https://testnet.cotiscan.io/address/${deployedAddress}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
