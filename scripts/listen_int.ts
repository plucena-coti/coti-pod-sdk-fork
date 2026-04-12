import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
    const evmAddr = "0xA2Ff922da0b4BF178B5A94679C96a17082585B5f";
    
    // The event signature for MessageReply(bytes32,bytes32,string)
    const replyTopic = ethers.id("MessageReply(bytes32,bytes32,string)");
    
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = latestBlock - 10000;
    
    console.log(`Polling from block ${fromBlock} to ${latestBlock}...`);
    
    try {
        const logs = await provider.getLogs({
            address: evmAddr,
            topics: [replyTopic],
            fromBlock: fromBlock,
            toBlock: latestBlock
        });
        
        console.log(`Found ${logs.length} reply events!`);
        
        const abi = ["event MessageReply(bytes32 indexed requestId, bytes32 originalId, string status)"];
        const iface = new ethers.Interface(abi);
        
        for (const log of logs) {
            const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
            console.log("\n=========================");
            console.log(`Txn Hash: ${log.transactionHash}`);
            console.log(`Request ID: ${parsed?.args[0]}`);
            console.log(`Original ID: ${parsed?.args[1]}`);
            console.log(`Status string: ${parsed?.args[2]}`);
        }
    } catch (e) {
        console.error("Error fetching logs:", e);
    }
}
main();
