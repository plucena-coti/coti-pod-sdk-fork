import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
    // Read the V3 deployment addresses
    const addrs = JSON.parse(fs.readFileSync("v3_int_deploy.json", "utf8"));
    const EVM_ADDR = addrs.evm;

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    
    // Load the contract artifact
    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
    const dmEvm = new ethers.Contract(EVM_ADDR, evmArtifact.abi, provider);

    // The request ID generated from your most recent V3 dispatch
    const reqId = "0x00000000000000000000000000aa36a700000000000000000000000000000050";
    
    console.log(`Pulling results for RequestId: ${reqId}\n`);

    // 1. Check the Status Enumerator (0 = None, 1 = Pending, 2 = Completed)
    const statusEnum = await dmEvm.statusByRequest(reqId);
    const statusMap = ["None", "Pending", "Completed"];
    console.log(`State: ${statusMap[statusEnum]} (${statusEnum})`);
    
    // 2. If completed, fetch the response msg attached by COTI relayer
    if (statusEnum === 2n) {
        const msg = await dmEvm.statusMsgByRequest(reqId);
        console.log(`\n🎉 Success! COTI Network responded with:\n"${msg}"`);
    } else {
        console.log(`\n⏳ Message is still currently in-flight on the bridge...`);
    }
}
main().catch(console.error);
