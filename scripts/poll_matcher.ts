import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  
  // The contract address of your deployed StringMatcherEvm
  const contractAddress = "0xd7656ACACE5Ab0081f453047DA514283928db544";
  
  const txHash = process.env.TX_HASH;
  if (!txHash) {
      console.error("❌ Please provide a transaction hash via the TX_HASH environment variable.");
      console.error("Usage: TX_HASH=0xYourTxHash npx hardhat run scripts/poll_matcher.ts --network sepolia");
      process.exit(1);
  }

  const artifact = await hre.artifacts.readArtifact("StringMatcherEvm");
  const matcher = new ethers.Contract(contractAddress, artifact.abi, provider);

  console.log(`1. Fetching transaction receipt for: ${txHash}`);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
     console.error("Receipt not found. Make sure the RPC URL is correct and the TX was mined.");
     return;
  }

  let requestId = null;
  for (const log of receipt.logs) {
      try {
          const parsed = matcher.interface.parseLog(log as any);
          if (parsed && parsed.name === "MatchRequested") {
              requestId = parsed.args.requestId;
              break;
          }
      } catch (e) {
          // Ignore logs from other contracts
      }
  }

  if (!requestId) {
      console.error("❌ Could not find a 'MatchRequested' event in this transaction.");
      return;
  }

  console.log(`2. Found RequestId: ${requestId}`);
  console.log(`3. Polling status for Request ID: ${requestId}...`);

  const status = await matcher.statusByRequest(requestId);
  console.log(`Current Status mapping (0=None, 1=Pending, 2=Completed, 3=Failed): ${status}`);

  if (status === 2n /* Completed */) {
    const ctResult = await matcher.resultByRequest(requestId);
    console.log(`\n✅ Execution Completed!`);
    
    // Convert the uint256 representation of ctBool back to a hex string
    const ctHex = "0x" + ctResult.toString(16).padStart(64, "0");
    console.log(`Encrypted Boolean Result (ctBool uint256):`);
    console.log(ctHex);
    
    console.log("\nDecryption tip: Check with your CotiPodCrypto implementation whether DataType.Bool resolves properly for string matching.");
  } else if (status === 3n) {
    console.log(`\n❌ Execution Failed. Check the COTI network explorer for the Inbox Error.`);
  } else {
    console.log(`\n⏳ Request is still pending... relayer may be taking time.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
