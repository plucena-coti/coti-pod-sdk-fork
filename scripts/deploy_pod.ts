import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const url = "https://testnet.coti.io/rpc";
  const provider = new ethers.JsonRpcProvider(url);
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const network = await provider.getNetwork();
  console.log(`\nInitializing deployment on Network: ${network.name} (Chain ID: ${network.chainId})`);
  
  if (network.chainId !== 7082400n) {
    console.warn("⚠️ Warning: You are not connected to the COTI Testnet.");
  }

  console.log(`Deploying from account: ${deployer.address}`);
  const balance = await provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} COTI\n`);

  console.log("Compiling & Deploying DirectMessagePod.sol...");
  const artifact = await hre.artifacts.readArtifact("DirectMessagePod");
  const DirectMessagePod = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  // The MPC_EXECUTOR_ADDRESS acts as the "Inbox" relayer on the COTI side!
  const MPC_EXECUTOR = "0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c";
  console.log(`Using MPC_EXECUTOR as Inbox: ${MPC_EXECUTOR}`);

  const directMessagePod = await DirectMessagePod.deploy(MPC_EXECUTOR);
  await directMessagePod.waitForDeployment();
  const deployedAddress = await directMessagePod.getAddress();
  
  console.log("\n✅ Deployment Successful!");
  console.log(`🎯 DirectMessagePod deployed to: ${deployedAddress}`);
  console.log(`🔍 View on Explorer: https://testnet.cotiscan.io/address/${deployedAddress}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
