import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  
  const contractAddress = process.env.DIRECT_EVM || "CHANGE_ME";
  if (contractAddress === "CHANGE_ME") {
      console.log("❌ Please pass contract address via DIRECT_EVM");
      process.exit(1);
  }
  
  const txHash = process.env.TX_HASH;
  if (!txHash) {
      console.error("❌ Please provide a transaction hash via the TX_HASH environment variable.");
      process.exit(1);
  }

  const artifact = await hre.artifacts.readArtifact("DirectMessageEvm");
  const directMessage = new ethers.Contract(contractAddress, artifact.abi, provider);

  console.log(`1. Fetching transaction receipt for: ${txHash}`);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
     console.error("Receipt not found. Make sure the RPC URL is correct and the TX was mined.");
     return;
  }

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

  console.log(`2. Found RequestId: ${requestId}`);
  console.log(`3. Polling status for Request ID: ${requestId}...`);

  const status = await directMessage.statusByRequest(requestId);
  console.log(`Current Status mapping (0=None, 1=Pending, 2=Completed, 3=Failed): ${status}`);

  if (status === 2n /* Completed */) {
    const statusMsg = await directMessage.statusMsgByRequest(requestId);
    console.log(`\n✅ Execution Completed!`);
    console.log(`Returned Status Message from COTI: "${statusMsg}"`);
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
