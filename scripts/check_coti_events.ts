import { ethers } from "ethers";

async function main() {
    const COTI_POD_ADDR = "0xb3a8d2DF02b439fb9c309143feDadA14BB2F618E";
    const provider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    
    console.log(`Checking COTI Testnet for execution events on ${COTI_POD_ADDR}...`);
    
    // We look for any logs from this contract in the last few thousand blocks
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 50000);
    
    const logs = await provider.getLogs({
        address: COTI_POD_ADDR,
        fromBlock,
        toBlock: "latest"
    });

    console.log(`Found ${logs.length} logs.`);
    
    // CiphertextSaved(bytes32 indexed msgId, address indexed recipient)
    const CIPHERTEXT_SAVED_TOPIC = ethers.id("CiphertextSaved(bytes32,address)");

    for (const log of logs) {
        if (log.topics[0] === CIPHERTEXT_SAVED_TOPIC) {
            console.log(`\n✅ CiphertextSaved Emitted!`);
            console.log(`Block: ${log.blockNumber}`);
            console.log(`TxHash: ${log.transactionHash}`);
            console.log(`RequestId / MsgId: ${log.topics[1]}`);
        } else {
            console.log(`\nOther event emitted in Tx: ${log.transactionHash}`);
            console.log("Topics:", log.topics);
        }
    }
}
main().catch(console.error);
