import hre from "hardhat";
import { ethers } from "ethers";
// Import from src to bypass the Node.js 25 self-reference ERR_MODULE_NOT_FOUND
import { CotiPodCrypto, DataType } from "../src/index"; 

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  
  // The deployed contract address and your transaction hash
  const contractAddress = "0x2aA07A3A4FCDdb8D64febF61e7cfDEF79Fa0b6f9";
  
  // Find the txHash from environment variable
  const txHash = process.env.TX_HASH;
  if (!txHash) {
      console.error("❌ Please provide a transaction hash via the TX_HASH environment variable.");
      console.error("Usage: TX_HASH=0xYourTxHash npx hardhat run scripts/read-result.ts --network sepolia");
      process.exit(1);
  }
  
  const artifact = await hre.artifacts.readArtifact("PrivateAdder");
  const privateAdder = new ethers.Contract(contractAddress, artifact.abi, provider);

  console.log(`1. Fetching transaction receipt for: ${txHash}`);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
     console.error("Receipt not found. Make sure the RPC URL is correct and the TX was mined.");
     return;
  }

  // 2. Extract the RequestId from the logs
  let requestId = null;
  for (const log of receipt.logs) {
      try {
          const parsed = privateAdder.interface.parseLog(log as any);
          if (parsed && parsed.name === "AddRequested") {
              requestId = parsed.args.requestId;
              break;
          }
      } catch (e) {
          // Ignore logs from other contracts
      }
  }

  if (!requestId) {
      console.error("Could not find an 'AddRequested' event in this transaction.");
      return;
  }
  console.log(`2. Extracted RequestId: ${requestId}`);

  // 3. Query the Blockchain state for this RequestId
  const status = await privateAdder.statusByRequest(requestId);
  
  const statusMap = ["None (0)", "Pending (1)", "Completed (2)"];
  console.log(`3. Current Status: ${statusMap[Number(status)] || status}`);

  if (status === 2n /* Completed */) {
      const ct = await privateAdder.sumByRequest(requestId);
      const ctHex = typeof ct === "bigint" ? "0x" + ct.toString(16) : String(ct);
      console.log(`4. Encrypted Sum (ctUint64): ${ctHex}`);
      
      // 5. Decrypt the result using an AES Key from the environment
      const accountAesKey = process.env.ACCOUNT_AES_KEY;
      
      if (!accountAesKey) {
          console.log(`\n⚠️ To decrypt this, please provide your AES Key via the ACCOUNT_AES_KEY environment variable.`);
          console.log(`Example: TX_HASH=${txHash} ACCOUNT_AES_KEY=0xYourAesKey npx hardhat run scripts/read-result.ts --network sepolia`);
      } else {
          try {
              const decryptedString = CotiPodCrypto.decrypt(ctHex, accountAesKey, DataType.Uint64);
              console.log(`\n🎉 5. Decrypted Sum (Plaintext): ${decryptedString}`);
          } catch (e: any) {
              console.error(`\n❌ Decryption failed. Ensure your ACCOUNT_AES_KEY is the correct 32-byte hex string. Error: ${e.message}`);
          }
      }
  } else {
      console.log("\n⚠️ The request is still Pending. The COTI MPC network has not processed it yet.");
      console.log("According to the docs: 'Undershooting typically leaves the request stuck or failing.'");
      console.log("This usually means msg.value or callbackFeeLocalWei were insufficient, or the Sepolia testnet relayer is trailing.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
