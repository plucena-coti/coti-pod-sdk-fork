import hre from "hardhat";
import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "@coti/pod-sdk";

async function main() {
  const privateKey = process.env.PRIVATE_KEY!;
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Deployed DirectIntMessageEvm
  const contractAddress = "0xFD48932832Ab9111C116d818340dAB42ACb60c73"; // <-- UPDATE THIS

  

  const artifact = await hre.artifacts.readArtifact("DirectIntMessageEvm");
  const dmEvm = new ethers.Contract(contractAddress, artifact.abi, wallet);

  console.log("1. Encrypting integer payload...");
  const secretInt = "1337";
  const encryptedPayload = await CotiPodCrypto.encrypt(
    secretInt,
    "testnet",
    DataType.Uint64
  ) as any;

  // Format it string/bigint mapping for itUint64 tuple (uint256, bytes)
  const itUint64Args = {
    ciphertext: typeof encryptedPayload.ciphertext === "bigint" 
        ? encryptedPayload.ciphertext 
        : BigInt(encryptedPayload.ciphertext),
    signature: typeof encryptedPayload.signature === "string" 
        ? (encryptedPayload.signature.startsWith("0x") ? encryptedPayload.signature : "0x" + encryptedPayload.signature)
        : encryptedPayload.signature,
  };

  const callbackFeeWei = ethers.parseEther("0.02"); 
  const totalWei       = ethers.parseEther("0.035"); 

  console.log(`2. Submitting 'sendMessage(1337)' transaction...`);
  try {
      const tx = await dmEvm.sendMessage(
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
              const parsed = dmEvm.interface.parseLog(log as any);
              if (parsed && parsed.name === "MessageDispatched") {
                  requestId = parsed.args.requestId;
                  break;
              }
          } catch (e) {}
      }
      
      console.log(`Found RequestId: ${requestId}`);
      console.log("3. Waiting for asynchronous execution (polling RequestStatus)...");
      
      for (let i = 0; i < 20; i++) {
        const status = await dmEvm.statusByRequest(requestId);
        if (status === 2n /* Completed */) {
          const statusMsg = await dmEvm.statusMsgByRequest(requestId);
          console.log(`\n✅ Execution Completed!`);
          console.log(`Status Message from Relayer: ${statusMsg}`);
          return;
        }
        
        process.stdout.write("Status pending... waiting 5 seconds...\r");
        await new Promise((r) => setTimeout(r, 5000));
      }
      
      console.log("\nTimeout waiting for relayer completion. Check status manually later.");
  } catch (err:any) {
      console.error(err);
  }
}

main().catch(console.error);
