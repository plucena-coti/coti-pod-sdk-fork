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

  console.log("\n2. Encrypting SMALL Direct Message payload...");
  const encryptedPayload = (await CotiPodCrypto.encrypt(
    "Hi", 
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

  const callbackFeeWei = ethers.parseEther("0.02"); 
  const totalWei       = ethers.parseEther("0.04"); 

  console.log(`\n3. Dispatching message across the bridge to ${wallet.address}...`);
  console.log(`   (msg.value: ${ethers.formatEther(totalWei)} ETH)`);
  
  const tx = await dmEvm.sendMessage(
    itStringArgs,
    wallet.address, 
    callbackFeeWei,
    { value: totalWei, gasLimit: 3000000 }
  );

  console.log("Transaction Hash:", tx.hash);
  const receipt = await tx.wait();

  let requestId = null;
  for (const log of receipt.logs) {
      try {
          const parsed = dmEvm.interface.parseLog(log as any);
          if (parsed && parsed.name === "MessageDispatched") {
              requestId = parsed.args.requestId;
              break;
          }
      } catch (e) {}
  }
  console.log(`Bridge RequestId: ${requestId}`);
}

main().catch((error) => {
  console.error("❌ Interaction failed:", error);
  process.exitCode = 1;
});
