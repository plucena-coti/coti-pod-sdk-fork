import hre from "hardhat";
import { ethers } from "ethers";
// Import from src to bypass the Node.js 25 self-reference ERR_MODULE_NOT_FOUND
import { CotiPodCrypto, DataType } from "../src/index"; 

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  
  // The deployed contract address and your transaction hash
  const contractAddress = "0x2aA07A3A4FCDdb8D64febF61e7cfDEF79Fa0b6f9";
  const txHash = "0xef676be92e51de549d13723257fa4e18f1496f5160d86bf5a918af35bac0f88f";
  
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
      
      // We need a real user accountAesKey to decrypt, using placeholder here
      const dummyKey = "0x0000000000000000000000000000000000000000000000000000000000000000";
      console.log(`\nTo decrypt this, pass the AES Key and ctHex to CotiPodCrypto.decrypt(ctHex, key, DataType.Uint64).`);
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
