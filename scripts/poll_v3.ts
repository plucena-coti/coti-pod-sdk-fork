import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
    const addrs = JSON.parse(fs.readFileSync("v3_int_deploy.json", "utf8"));
    const EVM_ADDR = addrs.evm;

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const dmEvm = new ethers.Contract(EVM_ADDR, evmArtifact.abi, deployer);

    const reqId = "0x00000000000000000000000000aa36a700000000000000000000000000000050";
    let statusEnum = await dmEvm.statusByRequest(reqId);
    console.log(`Status of ${reqId}: ${statusEnum}`);
    
    // Check logs
    const filter = dmEvm.filters.MessageReply();
    const logs = await dmEvm.queryFilter(filter, -100); 
    console.log(`Found ${logs.length} MessageReply events...`);
}
main().catch(console.error);
