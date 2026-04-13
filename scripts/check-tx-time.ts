import { ethers } from "hardhat";

async function main() {
  const provider = ethers.provider;
  const txHash = "0x759440387c2b80877a4e934d8ce3ee44eb257d66b476d08987fa523eeff4bfd8";
  
  const tx = await provider.getTransaction(txHash);
  if (tx && tx.blockNumber) {
    const block = await provider.getBlock(tx.blockNumber);
    if (block) {
      console.log(`Transaction included in block: ${tx.blockNumber}`);
      console.log(`Submission Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()} (Local Time)`);
      console.log(`Unix Timestamp: ${block.timestamp}`);
    } else {
      console.log("Block not found.");
    }
  } else {
    console.log("Transaction not found or not yet mined.");
  }
}
main().catch(console.error);
