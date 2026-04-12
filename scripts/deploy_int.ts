import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  const nonce = await provider.getTransactionCount(deployer.address, "latest");
  console.log(`Using nonce: ${nonce}`);
  
  console.log("Compiling & Deploying DirectIntMessageEvm.sol...");
  const artifact = await hre.artifacts.readArtifact("DirectIntMessageEvm");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  const contract = await factory.deploy({ nonce: nonce });
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log(`🎯 DirectIntMessageEvm deployed to (Sepolia): ${address}`);
}
main().catch(console.error);
