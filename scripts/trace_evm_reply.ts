import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
    const address = "0x6CcA577c51C878c64510CCb782F99eAE7d698d72";
    const logs = await provider.getLogs({
        address: address,
        fromBlock: -100,
        toBlock: "latest",
        topics: [ ethers.id("MessageReply(bytes32,bytes32,string)") ]
    });
    console.log("Total MessageReply events found on EVM:", logs.length);
    for (const log of logs) {
        console.log("Top level Log:", log.transactionHash, "Block:", log.blockNumber);
    }
}
main().catch(console.error);
