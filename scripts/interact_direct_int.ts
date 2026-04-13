import hre from "hardhat";
import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "@coti/pod-sdk";

async function main() {
  const privateKey = process.env.PRIVATE_KEY!;
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(privateKey, provider);

  // You must set this after running deploy_direct_int.ts
  const contractAddress = process.env.DIRECT_INT_EVM || "CHANGE_ME";
  if (contractAddress === "CHANGE_ME") {
      console.log("❌ Please update the contractAddress in interact_direct_int.ts or pass it via DIRECT_INT_EVM");
      process.exit(1);
  }

  const artifact = await hre.artifacts.readArtifact("DirectIntMessageEvm");
  const directInt = new ethers.Contract(contractAddress, artifact.abi, wallet);

  console.log("1. Encrypting uint64 message...");
  
  const mySecretInt = BigInt(42);
  const encryptedPayload = await CotiPodCrypto.encrypt(mySecretInt, "testnet", DataType.Uint64) as any;
  
  let formattedCiphertext = encryptedPayload.ciphertext.value || encryptedPayload.ciphertext;
  if (!Array.isArray(formattedCiphertext)) {
      formattedCiphertext = [formattedCiphertext];
  }
  
  let formattedSignature = encryptedPayload.signature;
  if (!Array.isArray(formattedSignature)) {
      formattedSignature = [formattedSignature];
  }
  formattedSignature = formattedSignature.map((sig: string) => sig.startsWith("0x") ? sig : "0x" + sig);

  const itUint64Args = {
      ciphertext: {
          value: formattedCiphertext.map((c: any) => {
              if (typeof c === "bigint") return c;
              return typeof c === "string" && !c.startsWith("0x") ? "0x" + c : c;
          })
      },
      signature: formattedSignature,
  };

  const callbackFeeWei = ethers.parseEther("0.02"); 
  const totalWei       = ethers.parseEther("0.035"); 

  console.log("2. Submitting 'sendMessage' transaction...");
  try {
      const tx = await directInt.sendMessage(
        itUint64Args,
        wallet.address, // recipient
        callbackFeeWei,
        { value: totalWei, gasLimit: 3000000 }
      );
    
      console.log(`Tx Hash: ${tx.hash}`);
      const receipt = await tx.wait();
    
      let requestId = null;
      for (const log of receipt.logs) {
          try {
              const parsed = directInt.interface.parseLog(log as any);
              if (parsed && parsed.name === "MessageDispatched") {
                  requestId = parsed.args.requestId;
                  break;
              }
          } catch (e) {}
      }
      
      if (!requestId) {
          console.error("❌ Could not find a 'MessageDispatched' log.");
          return;
      }
      
      console.log(`Found RequestId: ${requestId}`);
      console.log("3. Waiting for asynchronous execution (polling statusByRequest)...");
      
      for (let i = 0; i < 40; i++) {
        const status = await directInt.statusByRequest(requestId);
        if (status === 2n /* Completed */) {
          const statusMsg = await directInt.statusMsgByRequest(requestId);
          console.log(`\n✅ Execution Completed!`);
          console.log(`Returned Status Message from COTI: "${statusMsg}"`);
          return;
        } else if (status === 3n /* Error */) {
          console.log(`\n❌ Execution Failed. Check the COTI network explorer for the Inbox Error.`);
          return;
        }
        
        process.stdout.write("Status pending... waiting 5 seconds...\r");
        await new Promise((r) => setTimeout(r, 5000));
      }
      console.log(`\n⏳ Timed out waiting for completion. You can check the transaction later.`);
  } catch (err:any) {
      console.error(err);
  }
}

main().catch(console.error);
