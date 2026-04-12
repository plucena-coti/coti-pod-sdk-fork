import { ethers } from "ethers";
async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const txHash = "0x1614026840a2e2cba4b1e2f98bf28117cc62fc3b206e3a5de3d700093d76de8e";
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) { console.log("Tx not found"); return; }
    const block = await provider.getBlock(receipt.blockHash);
    const date = new Date(block.timestamp * 1000);
    console.log(`\nTransaction submitted and mined at: ${date.toUTCString()} (Local: ${date.toLocaleString()}) in Block: ${block.number}`);
}
main();
