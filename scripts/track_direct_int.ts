import "dotenv/config";
import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);

    // Extract the deployed contract address directly from the interact script
    const interactScript = fs.readFileSync("scripts/interact_direct_int.ts", "utf8");
    const match = interactScript.match(/const contractAddress = ["'](0x[a-fA-F0-9]{40})["']/);
    if (!match) {
        throw new Error("Could not find contractAddress in interact_direct_int.ts");
    }
    const contractAddress = match[1];

    // Allow passing a Request ID via arguments, fallback to the one from your logs
    let requestId = process.argv[2];
    if (!requestId) {
        requestId = "0x00000000000000000000000000aa36a700000000000000000000000000000059";
        console.log(`No Request ID provided in args. Defaulting to: ${requestId}`);
    }

    console.log(`Tracking Request via DirectIntMessageEvm at ${contractAddress}...`);
    
    // Read ABI
    const artifactPath = "artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json";
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const dmEvm = new ethers.Contract(contractAddress, artifact.abi, provider);

    const status = await dmEvm.statusByRequest(requestId);
    const statusMap = ["None (0)", "Pending (1)", "Completed (2)"];
    console.log(`\nStatus: ${statusMap[Number(status)] || status}`);

    if (status === 2n /* Completed */) {
        const statusMsg = await dmEvm.statusMsgByRequest(requestId);
        console.log(`✅ Execution Completed!`);
        console.log(`Relayer Status Message: ${statusMsg}`);
    } else {
        console.log("\n⚠️ Request is still Pending.");
        console.log("The COTI MPC network is processing the request, or the Sepolia testnet relayer is trailing.");
    }
}

main().catch(console.error);
