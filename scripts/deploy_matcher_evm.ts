import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  console.log("Deploying StringMatcherEvm to Sepolia...");
  const artifact = await hre.artifacts.readArtifact("StringMatcherEvm");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  const evm = await factory.deploy();
  await evm.waitForDeployment();
  const address = await evm.getAddress();
  
  console.log(`✅ StringMatcherEvm deployed to: ${address}`);
  
  const COTI_POD_ADDR = "0xFa2aacfeA464a5513dD5F44F978F9dd0197c9a9B"; // From step 1
  console.log(`Setting COTI Pod link to: ${COTI_POD_ADDR}`);
  
  const tx = await evm.setCotiContract(COTI_POD_ADDR);
  await tx.wait();
  console.log("✅ Linkage updated successfully.");
}
main().catch(console.error);
