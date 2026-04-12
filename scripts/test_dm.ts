import hre from "hardhat";
import { ethers } from "ethers";

const EVM_CONTRACT = "0xfA56400cebf6dfBEa5fBB0A13ce17Eb1017Aa156";
const COTI_CONTRACT = "0xDe6466c5C7B81d995C18B2a57036Bc7a6857a1e8";

async function main() {
  const privateKey = process.env.PRIVATE_KEY!;
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(privateKey, provider);

  const artifact = await hre.artifacts.readArtifact("DirectMessageEvm");
  const dmEvm = new ethers.Contract(EVM_CONTRACT, artifact.abi, wallet);

  // Use a simple payload
  const itStringArgs = {
      ciphertext: { value: ["0x" + "1".repeat(64)] },
      signature: ["0x" + "2".repeat(130)],
  };
  
  const callbackFeeWei = ethers.parseEther("0.005"); 
  const totalWei       = ethers.parseEther("0.01"); 

  console.log("Estimating gas...");
  try {
      const gas = await dmEvm.sendMessage.estimateGas(
          itStringArgs,
          wallet.address, 
          callbackFeeWei,
          { value: totalWei }
      );
      console.log("Gas:", gas);
  } catch (error: any) {
      console.error(error);
  }
}
main();
