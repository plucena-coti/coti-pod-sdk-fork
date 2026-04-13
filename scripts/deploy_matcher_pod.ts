import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  console.log("Deploying StringMatcherPod to COTI Testnet...");
  const artifact = await hre.artifacts.readArtifact("StringMatcherPod");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  // MPC_EXECUTOR is the Inbox mapped on the COTI side
  const MPC_EXECUTOR = "0x0F9A5cD00450db1217839C35d23D56F96d6331ae";
  
  const pod = await factory.deploy(MPC_EXECUTOR);
  await pod.waitForDeployment();

  console.log(`✅ StringMatcherPod deployed to: ${await pod.getAddress()}`);
}
main().catch(console.error);
