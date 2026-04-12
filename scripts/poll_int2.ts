import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
    const addrs = JSON.parse(fs.readFileSync("v2_int_deploy.json", "utf8"));
    const EVM_ADDR = addrs.evm;

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
    const dmEvm = new ethers.Contract(EVM_ADDR, evmArtifact.abi, deployer);

    // Using `statusByRequest` per the contract definition
    const requestId = "0x00000000000000000000000000aa36a70000000000000000000000000000004f";

    console.log(`Checking EVM completion status for Int request: ${requestId}`);
    const status = await dmEvm.statusByRequest(requestId);
    
    // Status enum: 0 = None, 1 = Pending, 2 = Completed
    const statusStrings = ["None", "Pending", "Completed"];
    console.log(`Status: ${statusStrings[status]} (${status})`);
    
    if (status === 2n) {
        console.log("Status is completed! It worked! Checking logs for final payload...");
        const filter = dmEvm.filters.MessageReceived();
        const logs = await dmEvm.queryFilter(filter, -100); 
        
        for (const log of logs) {
            const parsed = dmEvm.interface.parseLog(log as any);
            if (parsed && parsed.args.requestId === requestId) {
                console.log(`\n🎉 MessageReceived Event Found!`);
                console.log(`Request ID: ${parsed.args.requestId}`);
                console.log(`Sender: ${parsed.args.sender}`);
                console.log(`Plaintext Intercept Payload Returned from COTI: ${parsed.args.plainMessage.toString()}`);
            }
        }
    }
}
main().catch(console.error);
