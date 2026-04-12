import "dotenv/config";
import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  
  const contractAddress = "0x2aA07A3A4FCDdb8D64febF61e7cfDEF79Fa0b6f9";
  const artifactPath = "./artifacts/contracts/examples/PrivateAdder.sol/PrivateAdder.json";
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const privateAdder = new ethers.Contract(contractAddress, artifact.abi, provider);

  const txHash = "0x28b1918ddee52b8cb9b5b8ab12a30a938f70ed980470d22d1028756012a77805";
  
  console.log(`1. Fetching transaction receipt for: ${txHash}`);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
     console.error("Receipt not found.");
     return;
  }

  let requestId = null;
  for (const log of receipt.logs) {
      try {
          const parsed = privateAdder.interface.parseLog(log as any);
          if (parsed && parsed.name === "AddRequested") {
              requestId = parsed.args.requestId;
          }
      } catch (e) {}
  }

  console.log(`2. Extracted RequestId: ${requestId}`);

  const status = await privateAdder.statusByRequest(requestId);
  
  const statusMap = ["None (0)", "Pending (1)", "Completed (2)"];
  console.log(`3. Current Status: ${statusMap[Number(status)] || status}`);

  if (status === 2n) {
      const ct = await privateAdder.sumByRequest(requestId);
      const ctHex = typeof ct === "bigint" ? "0x" + ct.toString(16) : String(ct);
      console.log(`4. Encrypted Sum (ctUint64): ${ctHex}`);
  } else {
      console.log("\n⚠️ The request is still Pending.");
  }
}
main().catch(console.error);
