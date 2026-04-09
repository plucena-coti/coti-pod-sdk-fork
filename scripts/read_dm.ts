import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "../src/index.js";
import hre from "hardhat";

async function main() {
    const rawArg = process.argv[2] || "0";
    const accountAesKey = "58debe2c6edf83bc6fdae1713d6988fd";
    const COTI_CONTRACT = "0xDe6466c5C7B81d995C18B2a57036Bc7a6857a1e8";

    console.log(`\nConnecting to COTI Testnet...`);
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const podArtifact = await hre.artifacts.readArtifact("DirectMessagePod");
    const podContract = new ethers.Contract(COTI_CONTRACT, podArtifact.abi, cotiProvider);

    let targetMessageId: string = rawArg;

    if (!rawArg.startsWith("0x") && !isNaN(Number(rawArg))) {
        const index = Number(rawArg);
        console.log(`Looking up message index ${index} on COTI Testnet...`);
        const filter = podContract.filters.CiphertextSaved();
        const currentBlock = await cotiProvider.getBlockNumber();
        const events = await podContract.queryFilter(filter, Math.max(0, currentBlock - 5000), "latest");
        
        if (events.length > 0 && events.length > index) {
            targetMessageId = (events[index] as any).args.msgId;
            console.log(`Found! Using Message ID: ${targetMessageId}`);
        } else {
            console.log(`❌ No CiphertextSaved event found at index ${index}. (The cross-chain message may be pending processing by MPC nodes).`);
            console.log(`Falling back to hardcoded test ID if available...`);
            targetMessageId = "0x00000000000000000000000000aa36a70000000000000000000000000000002e";
        }
    }

    console.log(`\nFetching ciphertext from COTI for message ID: ${targetMessageId}`);
    
    let ctString;
    try {
        ctString = await podContract.getMessage(targetMessageId);
    } catch(e) {
        console.error("❌ Failed to query getMessage() from the contract.");
        return;
    }
        
    let data = Array.isArray(ctString) ? (ctString[0] || ctString) : ctString;
    
    if (!data || data.length === 0 || (typeof data === 'object' && !('value' in data) && data.length === 0)) {
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

    console.log(`Encrypted chunks found on COTI: ${hexValues.length}`);
    console.log(`Decrypting with AES Key: ${accountAesKey}...`);
    
    try {
        const plaintext = await CotiPodCrypto.decrypt({ value: hexValues } as any, accountAesKey, DataType.String);
        
        console.log("\n=============================");
        console.log("✅ Decrypted Cross-Chain Message:");
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
