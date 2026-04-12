import { ethers } from "ethers";

async function main() {
    // Check Sepolia side for the dispatch
    const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const txHash = "0x6f5db28ced82844e7a5d136e0aac6105aef1f55b8617dd810cd09f7c0d91400e";
    const receipt = await sepoliaProvider.getTransactionReceipt(txHash);
    
    let reqId = null;
    if (receipt) {
        console.log("Sepolia Logs:");
        for (const log of receipt.logs) {
            // Just printing topics to see if MessageDispatched (0x... something) is there
            console.log(log.topics[0]);
            // Usually RequestId is in topics[1] or data if not indexed
            if (log.topics.length > 1) {
                reqId = log.topics[1]; // assuming requestId is indexed
                console.log("Possible RequestId:", reqId);
            }
        }
    } else {
        console.log("Tx not found on Sepolia yet.");
    }

    // Check COTI side for CiphertextSaved
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const cotiAddress = "0xDe6466c5C7B81d995C18B2a57036Bc7a6857a1e8";
    const cotiLogs = await cotiProvider.getLogs({
        address: cotiAddress,
        fromBlock: 0,
        toBlock: "latest"
    });
    console.log("\nTotal events found on Coti Pod:", cotiLogs.length);
    for (const log of cotiLogs) {
        console.log("Coti Log Topics:", log.topics);
    }
}
main().catch(console.error);
