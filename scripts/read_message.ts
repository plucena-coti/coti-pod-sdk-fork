import hre from "hardhat";
import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "../src/index";

async function main() {
  const messageId = process.env.MESSAGE_ID;
  if (messageId === undefined) {
    throw new Error("Missing MESSAGE_ID in .env or inline args");
  }

  const url = "https://testnet.coti.io/rpc";
  const provider = new ethers.JsonRpcProvider(url);

  const contractAddress = "0x133608213cD92e93b589894C404841d638F692D8";
  const artifact = await hre.artifacts.readArtifact("DirectMessage");
  const contract = new ethers.Contract(contractAddress, artifact.abi, provider);

  console.log(`🔍 Fetching Message #${messageId} from the blockchain...`);
  
  const ctStringTuple = await contract.read_message(messageId);
  console.log(`🔐 Raw Encrypted Data type:`, typeof ctStringTuple);
  console.log(ctStringTuple);
}

main().catch((error) => {
  console.error("\n❌ Error reading message:", error);
  process.exitCode = 1;
});
