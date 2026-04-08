import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY missing in .env");

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  const artifact = await hre.artifacts.readArtifact("PrivateAdder");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log("Deploying PrivateAdder to Sepolia...");
  const privateAdder = await factory.deploy();
  await privateAdder.waitForDeployment();

  console.log(`PrivateAdder deployed to: ${await privateAdder.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
