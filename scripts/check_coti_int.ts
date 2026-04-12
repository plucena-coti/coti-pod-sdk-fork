import { ethers } from "ethers";

async function main() {
    const url = "https://testnet.coti.io/rpc";
    const provider = new ethers.JsonRpcProvider(url);
    const contractAddress = "0xb3a8d2DF02b439fb9c309143feDadA14BB2F618E";
    
    // CiphertextSaved(bytes32 indexed msgId, address indexed recipient)
    const topic0 = ethers.id("CiphertextSaved(bytes32,address)");
    
    console.log(`Checking events for ${contractAddress} on COTI Testnet...`);
    const logs = await provider.getLogs({
        address: contractAddress,
        fromBlock: 0,
        toBlock: "latest",
        topics: [topic0]
    });
    
    console.log(`Found ${logs.length} CiphertextSaved events on COTI!`);
}

main().catch(console.error);
