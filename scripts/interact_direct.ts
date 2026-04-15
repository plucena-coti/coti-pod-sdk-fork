import hre from "hardhat";
import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "@coti/pod-sdk";

async function main() {
  const privateKey = process.env.PRIVATE_KEY!;
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(privateKey, provider);

  // You must set this after running deploy_direct.ts
  const contractAddress = process.env.DIRECT_EVM || "CHANGE_ME";
  if (contractAddress === "CHANGE_ME") {
      console.log("❌ Please update the contractAddress in interact_direct.ts or pass it via DIRECT_EVM");
      process.exit(1);
  }

  const artifact = await hre.artifacts.readArtifact("DirectMessageEvm");
  const directMessage = new ethers.Contract(contractAddress, artifact.abi, wallet);

  console.log("1. Encrypting string message...");
  
  const mySecretString = "secure_message_xyz";
  const encryptedPayload = await CotiPodCrypto.encrypt(mySecretString, "testnet", DataType.String) as any;
  
  let formattedCiphertext = encryptedPayload.ciphertext.value || encryptedPayload.ciphertext;
  if (!Array.isArray(formattedCiphertext)) {
      formattedCiphertext = [formattedCiphertext];
  }
  
  let formattedSignature = encryptedPayload.signature;
  if (!Array.isArray(formattedSignature)) {
      formattedSignature = [formattedSignature];
  }
  formattedSignature = formattedSignature.map((sig: string) => sig.startsWith("0x") ? sig : "0x" + sig);

  const itStringArgs = {
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
      const tx = await directMessage.sendMessage(
        itStringArgs,
        "0xa8d10a99d3b7AC2373EdF144D4a8a99BFf9c00F4", // recipient
        callbackFeeWei,
        { value: totalWei, gasLimit: 5000000 }
      );
    
      console.log(`Tx Hash: ${tx.hash}`);
      const receipt = await tx.wait();
    
      let requestId = null;
      for (const log of receipt.logs) {
          try {
              const parsed = directMessage.interface.parseLog(log as any);
              if (parsed && parsed.name === "MessageDispatched") {
                  requestId = parsed.args.requestId;
                  break;
              }
          } catch (e) {}
      }
      
      if (!requestId) {
          console.error("❌ Could not find a 'MessageDispatched' event in this transaction.");
          return;
      }

      console.log(`Found RequestId: ${requestId}`);
      console.log("3. Waiting for asynchronous execution (polling statusByRequest)...");
      
      while (true) {
        const status = await directMessage.statusByRequest(requestId);
        if (status === 2n /* Completed */) {
          const statusMsg = await directMessage.statusMsgByRequest(requestId);
          console.log(`\n✅ Execution Completed!`);
          console.log(`Returned Status Message from COTI: "${statusMsg}"`);
          return;
        } else if (status === 3n) {
          console.log(`\n❌ Execution Failed. Check the COTI network explorer for the Inbox Error.`);
          return;
        }
        
        process.stdout.write("Status pending... waiting 5 seconds...\r");
        await new Promise((r) => setTimeout(r, 5000));
      }
  } catch (err:any) {
      console.error(err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
