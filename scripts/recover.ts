import hre from "hardhat";
import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "../src/index.js";

async function main() {
    const arg = process.argv[2] || "0";
    const accountAesKey = process.argv[3] || "58debe2c6edf83bc6fdae1713d6988fd";
    const COTI_CONTRACT = "0xDe6466c5C7B81d995C18B2a57036Bc7a6857a1e8";

    const url = "https://testnet.coti.io/rpc";
    const provider = new ethers.JsonRpcProvider(url);
    const artifact = await hre.artifacts.readArtifact("DirectMessagePod");
    const podContract = new ethers.Contract(COTI_CONTRACT, artifact.abi, provider);

    let targetMessageId: string = arg;

    console.log(`Connecting to COTI Testnet...`);

    // If the user provided a small number (like "0"), let's find the events and use the Nth message!
    if (!arg.startsWith("0x") && !isNaN(Number(arg))) {
        const index = Number(arg);
        console.log(`User requested message index ${index}. Fetching past CiphertextSaved events...`);
        const filter = podContract.filters.CiphertextSaved();
        const currentBlock = await provider.getBlockNumber();
        const events = await podContract.queryFilter(filter, Math.max(0, currentBlock - 50000), "latest");
        
        if (events.length > 0 && events.length > index) {
            targetMessageId = (events[index] as any).args.msgId;
            console.log(`Found event! Using Message ID: ${targetMessageId}`);
        } else {
            console.log(`Event index ${index} out of bounds. Trying to parse as raw bytes32...`);
            const hex = Number(arg).toString(16);
            const paddedHex = hex.length % 2 !== 0 ? "0" + hex : hex;
            targetMessageId = ethers.zeroPadValue("0x" + paddedHex, 32);
        }
    }

    console.log(`Fetching ciphertext for message ID: ${targetMessageId}`);
    try {
        const ctString = await podContract.getMessage(targetMessageId);

        let data = Array.isArray(ctString) ? (ctString[0] || ctString) : ctString;
        
        if (!data || data.length === 0) {
            console.log("❌ No ciphertext found for this messageId.");
            return;
        }
        
        // Convert to hex array expected by CotiPodCrypto decrypt
        const hexValues = data.map((v: any) => typeof v === "bigint" ? "0x" + v.toString(16) : String(v));

        console.log(`\nEncrypted data chunks: ${hexValues.length}`);
        console.log(`Decrypting with AES Key: ${accountAesKey}...`);
        
        // Construct the expected payload for SDK decrypt (it needs { ciphertext: { value:[] } } or just { value: [] } depending on signature)
        // Wait, SDK actually expects: encrypt returns result.ct, and decrypt takes it as { value }
        // Looking at SDK, `decrypt({ value: hexValues }, key, DataType.String)` works.
        const plaintext = CotiPodCrypto.decrypt(
            { value: hexValues },
            accountAesKey,
            DataType.String
        );

        console.log("\n=============================");
        console.log("✅ Decrypted Message Plaintext:");
        console.log(plaintext);
        console.log("=============================\n");
    } catch(e) {
        console.error("❌ Decryption/Read failed:", e);
    }
}

main().catch((error) => {
    console.error("Fatal:", error);
    process.exitCode = 1;
});
