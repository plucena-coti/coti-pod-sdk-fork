import { ethers } from "ethers";

async function main() {
  const evmAddr = "0xA2Ff922da0b4BF178B5A94679C96a17082585B5f";
  const apiKey = "T1BMTDEHSSUUG5P2X4IVZYK6I9XXQ9X7UU";
  // The event signature for MessageReply(bytes32,bytes32,string)
  const topic0 = "0x8fa30feacbcc089dfb60fbab177beaa9eb5782fdbe41477aa2f8c5bde1bdeea6";
  const uri = `https://api-sepolia.etherscan.io/api?module=logs&action=getLogs&fromBlock=1000000&toBlock=latest&address=${evmAddr}&topic0=${topic0}&apikey=${apiKey}`;
  
  const res = await fetch(uri);
  const data = await res.json();
  
  if (data.status === "1" && data.result.length > 0) {
      console.log(`✅ Found ${data.result.length} MessageReply events!`);
      const last = data.result[data.result.length - 1];
      
      // Etherscan returns 'hash' instead of 'transactionHash'
      console.log("Tx Hash:", last.transactionHash || last.hash);
      
      const abi = ["event MessageReply(bytes32 indexed requestId, bytes32 originalId, string status)"];
      const iface = new ethers.Interface(abi);

      // Etherscan API returns topics as separate properties (topic0, topic1, topic2)
      const topics = [last.topic0, last.topic1, last.topic2].filter(t => t);
      
      const parsed = iface.parseLog({ topics, data: last.data });
      console.log(`Original RequestId: ${parsed?.args.originalId}`);
      console.log(`Status string: ${parsed?.args.status}`);
  } else {
      console.log(`Found 0 events so far.`);
  }
}
main().catch(console.error);
