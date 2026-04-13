import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  const nonce = await provider.getTransactionCount(deployer.address, "latest");
  console.log(`Using nonce: ${nonce}`);

  console.log("Compiling & Deploying DirectIntMessagePod.sol...");
  const artifact = await hre.artifacts.readArtifact("DirectIntMessagePod");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  const MPC_EXECUTOR = "0x0F9A5cD00450db1217839C35d23D56F96d6331ae"; // Inbox equivalent for COTI
  const contract = await factory.deploy(MPC_EXECUTOR, { nonce: nonce });
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log(`🎯 DirectIntMessagePod deployed to (COTI Testnet): ${address}`);
}
main().catch(console.error);
