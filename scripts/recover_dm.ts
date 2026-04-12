import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "../src/index.js";
import hre from "hardhat";

async function main() {
    const rawArg = process.argv[2] || "0";
    const accountAesKey = process.argv[3] || "58debe2c6edf83bc6fdae1713d6988fd";
    const COTI_CONTRACT = "0xDe6466c5C7B81d995C18B2a57036Bc7a6857a1e8";

    // 1. Use the known Request IDs we dispatched earlier today
    let requestIds = [rawArg];
    if (rawArg === "0" || !rawArg.startsWith("0x")) {
        console.log(`Using fallback known Request IDs from tonight's session...`);
        requestIds = [
             "0x00000000000000000000000000aa36a70000000000000000000000000000002e", // The second one we sent (success)
             "0x00000000000000000000000000aa36a70000000000000000000000000000002d"  // The first one we sent 
        ];
    }

    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const podArtifact = await hre.artifacts.readArtifact("DirectMessagePod");
    const podContract = new ethers.Contract(COTI_CONTRACT, podArtifact.abi, cotiProvider);

    for (let requestId of requestIds) {
        console.log(`\nConnecting to COTI Testnet to fetch RequestId: ${requestId}`);
        
        let ctString;
        try {
            ctString = await podContract.getMessage(requestId);
        } catch(e) {
            console.log("Failed to fetch.");
            continue;
        }
        
        let data = Array.isArray(ctString) ? (ctString[0] || ctString) : ctString;
        
        if (!data || data.length === 0) {
            console.log("❌ No ciphertext found on COTI for this RequestId.");
            continue;
        }

        const hexValues = typeof ctString === "object" && 'value' in ctString 
          ? ctString.value.map((v: any) => typeof v === "bigint" ? "0x" + v.toString(16) : String(v)) 
          : data.map((v: any) => typeof v === "bigint" ? "0x" + v.toString(16) : String(v));

        if (hexValues.length === 0) {
           console.log("❌ Ciphertext array is empty.");
           continue; 
        }

        console.log(`\nEncrypted chunks found on COTI: ${hexValues.length}`);
        console.log(`Decrypting with AES Key: ${accountAesKey}...`);
        
        let plaintext;
        try {
            plaintext = await CotiPodCrypto.decrypt({ ciphertext: { value: hexValues } } as any, accountAesKey, DataType.String);
            
            console.log("\n=============================");
            console.log("✅ Decrypted Cross-Chain Message:");
            console.log(plaintext);
            console.log("=============================\n");
            return;
        } catch(e: any) {
            try {
                plaintext = await CotiPodCrypto.decrypt({ value: hexValues } as any, accountAesKey, DataType.String);
                console.log("\n=============================");
                console.log("✅ Decrypted Cross-Chain Message:");
                console.log(plaintext);
                console.log("=============================\n");
                return;
            } catch(e2:any) {
                console.error("❌ Decryption failed:", e2.message || e2);
            }
        }
    }
}

main().catch((error) => {
    console.error("Fatal:", error);
    process.exitCode = 1;
});
