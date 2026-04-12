import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  
  // The exact deployed contract we just used
  const EVM_ADDR = "0xE2fd06a3c85834178d033F67DeeD362485C0698b";
  const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
  
  const evmContract = new ethers.Contract(EVM_ADDR, evmArtifact.abi, provider);

  const txHash = "0xd3fd8bf26ee06a7ee7bba86b3994a46da62f3d6538813a4b94d736a10e4c9e4b";
  console.log(`1. Fetching transaction receipt for: ${txHash}`);
  
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
     console.error("Receipt not found. Wait for mining.");
     return;
  }

  let requestId = null;
  for (const log of receipt.logs) {
      try {
          const parsed = evmContract.interface.parseLog(log as any);
          if (parsed && parsed.name === "MessageDispatched") {
              requestId = parsed.args.requestId;
              break;
          }
      } catch (e) {}
  }

  if (!requestId) {
      console.log(`Could not extract RequestId! Using hardware returned one: 0x00000000000000000000000000aa36a70000000000000000000000000000004d`);
      requestId = "0x00000000000000000000000000aa36a70000000000000000000000000000004d";
  } else {
     console.log(`2. Extracted RequestId: ${requestId}`);
  }

  console.log(`3. Querying the Blockchain state directly...`);
  
  // Read state!
  const statusNumber = await evmContract.statusByRequest(requestId);
  const statusMap = ["None (0)", "Pending (1)", "Completed (2)"];
  console.log(`Current Status: ${statusMap[Number(statusNumber)] || statusNumber}`);

  if (statusNumber === 2n /* Completed */) {
      const responseStr = await evmContract.statusMsgByRequest(requestId);
      console.log(`Relayer Response Message: "${responseStr}"`);
  } else {
      console.log("\n⚠️ The request is still Pending. The COTI MPC network has not returned the cross-chain callback yet.");
  }
}

main().catch(console.error);
