import hre from "hardhat";
import { ethers } from "ethers";

const EVM_CONTRACT = process.env.EVM_CONTRACT || "0xFE0E04D422DB9b5Ffb88fEbdB4c3D366C919F0bB";
const COTI_CONTRACT = process.env.COTI_CONTRACT || "0x22a4B9248815d8Ecc62912bA343Dae953904d6d8";

async function main() {
    const txHash = process.env.TX_HASH || "0x7a069c9bb44802b53e4a10e29e5d195fd7636dee6d10b2c09f01bfc8d42d4d5d"; 
    
    console.log(`🔍 Tracking Cross-Chain Message for transaction: ${txHash}`);

    const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");

    const dmEvmArtifact = await hre.artifacts.readArtifact("DirectMessageEvm");
    const dmPodArtifact = await hre.artifacts.readArtifact("DirectMessagePod");

    const evmContract = new ethers.Contract(EVM_CONTRACT, dmEvmArtifact.abi, sepoliaProvider);
    const cotiContract = new ethers.Contract(COTI_CONTRACT, dmPodArtifact.abi, cotiProvider);

    console.log("\n[1] Checking Sepolia for Inbox Outgoing Message...");
    const receipt = await sepoliaProvider.getTransactionReceipt(txHash);

    if (!receipt) {
        console.error("❌ Transaction not found on Sepolia or not mined yet.");
        process.exit(1);
    }

    let requestId: string | null = null;
    let sender: string | null = null;
    let recipient: string | null = null;

    for (const log of receipt.logs) {
        try {
            const parsed = evmContract.interface.parseLog(log as any);
            if (parsed && parsed.name === "MessageDispatched") {
                requestId = parsed.args.requestId; 
                sender = parsed.args.sender;
                recipient = parsed.args.recipient;
                console.log(`✅ Message Dispatched Event Found!`);
                console.log(`   └─ Request ID: ${requestId}`);
                console.log(`   └─ Sender:     ${sender}`);
                console.log(`   └─ Recipient:  ${recipient}`);
            }
        } catch (e) {}
    }

    if (!requestId) {
        console.log("❌ No MessageDispatched event found in this transaction.");
        process.exit(1);
    }

    console.log("\n[2] Checking COTI Testnet for Execution (Outbox)...");
    
    const latestBlock = await cotiProvider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 500000);

    const filter = cotiContract.filters.CiphertextSaved(requestId);
    const logs = await cotiContract.queryFilter(filter, fromBlock, latestBlock);

    if (logs.length > 0) {
        console.log(`✅ Message Executed on COTI Testnet!`);
        console.log(`   └─ Transaction Hash: ${logs[0].transactionHash}`);
        console.log(`   └─ Block Number:     ${logs[0].blockNumber}`);
    } else {
        console.log(`⏳ Message not yet processed on COTI Testnet (or failed).`);
        console.log(`   The relayer might still be processing it, or the input fee / callback fee was too low.`);
        console.log(`   Note: You can check https://testnet.cotiscan.io/address/${COTI_CONTRACT} manually.`);
    }

    console.log("\n[3] Checking Sepolia for the Final Callback Reply...");
    console.log(`   *(Skipping Sepolia past-block query due to RPC block limits on this network).*`);
    console.log(`   To verify the completion locally, you can use your tx log scanner or etherscan.`);

    console.log("\n🎉 Tracking complete.");
}

main().catch(console.error);
