const { ethers } = require("ethers");
async function main() {
    const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org"); // or use process.env.SEPOLIA_RPC_URL
    const tx = await provider.getTransaction("0x61cf02b497aac7290b4bef27dee7bb05277aac0fbae98b1abdad6c2a0972a580");
    const receipt = await provider.getTransactionReceipt("0x61cf02b497aac7290b4bef27dee7bb05277aac0fbae98b1abdad6c2a0972a580");
    try {
        await provider.call(tx, tx.blockNumber);
    } catch (e) {
        console.log("REVERT REASON:", e.data || e.message);
    }
}
main();
