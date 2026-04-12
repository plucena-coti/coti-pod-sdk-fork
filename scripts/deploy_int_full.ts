import hre from "hardhat";
import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
  console.log("=== Deploying DirectIntMessagePod to COTI Testnet ===");
  const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
  const cotiWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);
  
  const podArtifact = await hre.artifacts.readArtifact("DirectIntMessagePod");
  const podFactory = new ethers.ContractFactory(podArtifact.abi, podArtifact.bytecode, cotiWallet);
  
  const MPC_EXECUTOR = "0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c";
  const podContract = await podFactory.deploy(MPC_EXECUTOR);
  await podContract.waitForDeployment();
  const cotiPodAddr = await podContract.getAddress();
  console.log(`✅ DirectIntMessagePod deployed to: ${cotiPodAddr}`);

  console.log("\n=== Deploying DirectIntMessageEvm to Sepolia ===");
  const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);

  const evmArtifact = await hre.artifacts.readArtifact("DirectIntMessageEvm");
  const evmFactory = new ethers.ContractFactory(evmArtifact.abi, evmArtifact.bytecode, sepoliaWallet);
  
  const evmContract = await evmFactory.deploy();
  await evmContract.waitForDeployment();
  const evmAddr = await evmContract.getAddress();
  console.log(`✅ DirectIntMessageEvm deployed to: ${evmAddr}`);

  console.log(`\nLinking EVM contract to COTI Pod contract...`);
  const tx = await (evmContract as any).setCotiContract(cotiPodAddr);
  await tx.wait();
  console.log(`✅ Linkage complete!`);

  fs.writeFileSync("v2_int_deploy.json", JSON.stringify({ coti: cotiPodAddr, evm: evmAddr }, null, 2));
  console.log("\nAddresses saved to v2_int_deploy.json");
}

main().catch(console.error);
