import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const txHash = "0xd3fd8bf26ee06a7ee7bba86b3994a46da62f3d6538813a4b94d736a10e4c9e4b";
    
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.blockNumber) {
        console.log("Could not find transaction.");
        return;
    }
    
    const block = await provider.getBlock(tx.blockNumber);
    const timestamp = block!.timestamp;
    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = now - timestamp;
    const mins = Math.floor(diffSeconds / 60);
    
    console.log(`Last message was submitted ${mins} minutes ago (${diffSeconds} seconds)`);
    console.log(`Block timestamp: ${new Date(timestamp * 1000).toLocaleString()}`);
}
main().catch(console.error);
