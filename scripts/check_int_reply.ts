import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org"); // Use public RPC that allows larger block ranges!
  const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
  
  const evmAddr = "0xA2Ff922da0b4BF178B5A94679C96a17082585B5f";
  const evm = new ethers.Contract(evmAddr, evmArtifact.abi, provider);
  
  console.log(`Checking MessageReply events on Sepolia via public RPC for contract ${evmAddr}...`);
  
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = currentBlock - 5000;
  
  const fromBlockHex = "0x" + fromBlock.toString(16);
  const toBlockHex = "0x" + currentBlock.toString(16);

  console.log(`Querying from block ${fromBlock} to ${currentBlock}`);

  const filter = evm.filters.MessageReply();
  const logs = await provider.getLogs({
      fromBlock: fromBlockHex,
      toBlock: toBlockHex,
      address: evmAddr,
      topics: filter.topics
  });
  
  if (logs.length === 0) {
      console.log("No MessageReply events found yet. The relayer might still be processing, or the callback gas limit wasn't high enough.");
  }

  for (const log of logs) {
      const parsed = evm.interface.parseLog(log as any);
      if (parsed) {
          console.log("\n✅ Relayer Reply Event Found!");
          console.log("RequestId:", parsed.args[0]);
          console.log("OriginalId:", parsed.args[1]);
          console.log("Status:", parsed.args[2]);
          console.log("Transaction Hash:", log.transactionHash);
      }
  }
}

main().catch(console.error);
