import hre from "hardhat";
import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "../src/index.js";

const EVM_CONTRACT = "0xfA56400cebf6dfBEa5fBB0A13ce17Eb1017Aa156";
const COTI_CONTRACT = "0xDe6466c5C7B81d995C18B2a57036Bc7a6857a1e8";

async function main() {
  const privateKey = process.env.PRIVATE_KEY!;
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(privateKey, provider);

  const artifact = await hre.artifacts.readArtifact("DirectMessageEvm");
  const dmEvm = new ethers.Contract(EVM_CONTRACT, artifact.abi, wallet);

  console.log("\n2. Encrypting Direct Message payload...");
  const encryptedPayload = (await CotiPodCrypto.encrypt(
    "Hello from Sepolia to COTI testnet! This is a longer cross-chain secret message spanning blocks.", 
    "testnet", 
    DataType.String
  )) as any;
  
  const formattedCiphertext = encryptedPayload.ciphertext.value.map((c: any) => 
     typeof c === "string" && !c.startsWith("0x") ? "0x" + c : c
  );
  const formattedSignature = encryptedPayload.signature;
  
  const itStringArgs = {
      ciphertext: { value: formattedCiphertext },
      signature: formattedSignature,
  };

  const callbackFeeWei = ethers.parseEther("0.005"); 
  const totalWei       = ethers.parseEther("0.01"); 

  console.log("Estimating gas with payload...");
  try {
      const gas = await dmEvm.sendMessage.estimateGas(
          itStringArgs,
          wallet.address, 
          callbackFeeWei,
          { value: totalWei }
      );
      console.log("Gas:", gas);
  } catch (error: any) {
      console.log("REVERT FOUND!");
      console.error(error.reason || error.data || error);
  }
}
main();
