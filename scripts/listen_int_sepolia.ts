import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
  const url = process.env.SEPOLIA_RPC_URL!;
  const provider = new ethers.JsonRpcProvider(url);
  const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
  
  const evmAddr = "0xA2Ff922da0b4BF178B5A94679C96a17082585B5f";
  const evm = new ethers.Contract(evmAddr, evmArtifact.abi, provider);
  
  console.log("Checking MessageReply events on Sepolia...");
  const block = await provider.getBlockNumber();
  const filter = evm.filters.MessageReply();
  const logs = await evm.queryFilter(filter, block - 100);
  
  for (const log of logs) {
      if (log instanceof ethers.EventLog) {
         console.log("Reply Event!", log.args);
      }
  }
}
main().catch(console.error);
