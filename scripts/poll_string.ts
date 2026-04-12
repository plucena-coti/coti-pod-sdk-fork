import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
    const deployment = JSON.parse(fs.readFileSync("string_deploy.json", "utf8"));
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    
    // Instead of querying logs (which the endpoint refuses), we'll parse the original TX receipt!
    const TX_HASH = "0xaa0542a343df9192e073b0954fc2fee55d201de3637a0cff593fe0201d9314eb";

    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/StringMatcherEvm.sol/StringMatcherEvm.json", "utf8"));
    const dmEvm = new ethers.Contract(deployment.evmAddress, evmArtifact.abi, provider);

    const receipt = await provider.getTransactionReceipt(TX_HASH);
    let resolvedReqId = null;
    
    for (const log of receipt!.logs) {
        try {
            const parsed = dmEvm.interface.parseLog(log as any);
            if (parsed && parsed.name === "MatchRequested") {
                resolvedReqId = parsed.args.requestId;
                break;
            }
        } catch (e) {}
    }

    console.log(`Pulling results for RequestId: ${resolvedReqId}\n`);

    const status = await dmEvm.statusByRequest(resolvedReqId);
    const statusMap = ["None (0)", "Pending (1)", "Completed (2)", "Error (3)"];
    console.log(`State: ${statusMap[Number(status)] || status}`);

    if (status === 2n /* Completed */) {
        const ctBoolAsUint256 = await dmEvm.resultByRequest(resolvedReqId);
        
        console.log(`\n🎉 Message processed successfully on COTI MPC!`);
        console.log(`Raw Returned ctBool: ${ctBoolAsUint256}`);
        
        const ctHex = "0x" + ctBoolAsUint256.toString(16).padStart(64, '0');
        console.log(`\nTo Decrypt, run the following inside your app logic:`);
        console.log(`const decryptedMatch = await CotiPodCrypto.decrypt("${ctHex}", accountAesKey, DataType.Boolean);`);
        console.log(`console.log("Did it match?", decryptedMatch)`);
    } else {
        console.log(`\n⏳ Message is still currently in-flight on the bridge...`);
    }
}
main().catch(console.error);
