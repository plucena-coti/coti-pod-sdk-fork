import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "../src/index.js";
import hre from "hardhat";

async function main() {
    const rawArg = process.argv[2]; // index or bytes32
    const cotiContract = process.argv[3]; // DirectMessagePod address
    const accountAesKey = process.argv[4]; // AES Key

    if (!rawArg || !cotiContract || !accountAesKey) {
        console.log("Usage: npx tsx scripts/read_message.ts <index_or_id> <coti_contract_address> <aes_key>");
        return;
    }

    console.log(`Connecting to COTI Testnet...`);
    const provider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const artifact = await hre.artifacts.readArtifact("DirectMessagePod");
    const podContract = new ethers.Contract(cotiContract, artifact.abi, provider);

    let targetMessageId: string = rawArg;

    // If "0" was passed, let's fetch the first CiphertextSaved event from the target contract
    if (!rawArg.startsWith("0x") && !isNaN(Number(rawArg))) {
        const index = Number(rawArg);
        console.log(`User requested message index ${index}. Fetching past CiphertextSaved events on COTI...`);
        const filter = podContract.filters.CiphertextSaved();
        const currentBlock = await provider.getBlockNumber();
        const events = await podContract.queryFilter(filter, Math.max(0, currentBlock - 500000), "latest");
        
        if (events.length > 0 && events.length > index) {
            targetMessageId = (events[index] as any).args.msgId;
            console.log(`Found event at index ${index}! Using Message ID: ${targetMessageId}`);
        } else {
            console.log(`❌ Event index ${index} out of bounds. Found ${events.length} total events. Cannot recover.`);
            return;
        }
    }

    console.log(`Fetching ciphertext for message ID: ${targetMessageId}`);
    
    let ctString;
    try {
        ctString = await podContract.getMessage(targetMessageId);
    } catch(e) {
        console.error("❌ Failed to query getMessage() from the contract:", e);
        return;
    }
        
    let data = Array.isArray(ctString) ? (ctString[0] || ctString) : ctString;
    
    if (!data || data.length === 0) {
        console.log("❌ No ciphertext found on COTI for this RequestId.");
        return;
    }

    // Convert values to hex format
    const hexValues = typeof ctString === "object" && 'value' in ctString 
        ? ctString.value.map((v: any) => typeof v === "bigint" ? "0x" + v.toString(16) : String(v)) 
        : data.map((v: any) => typeof v === "bigint" ? "0x" + v.toString(16) : String(v));

    if (hexValues.length === 0) {
        console.log("❌ Ciphertext array is empty.");
        return; 
    }

    console.log(`\nEncrypted chunks found on COTI: ${hexValues.length}`);
    console.log(`Decrypting with AES Key: ${accountAesKey}...`);
    
    try {
        const plaintext = await CotiPodCrypto.decrypt({ value: hexValues } as any, accountAesKey, DataType.String);
        
        console.log("\n=============================");
        console.log("✅ Decrypted Message:");
        console.log(plaintext);
        console.log("=============================\n");
    } catch(e: any) {
        console.error("❌ Decryption failed. Double check your AES Key and Network availability.", e.message || e);
    }
}

main().catch((error) => {
    console.error("Fatal:", error);
    process.exitCode = 1;
});
