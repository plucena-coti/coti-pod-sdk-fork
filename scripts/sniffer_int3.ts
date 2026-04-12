import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
    const addrs = JSON.parse(fs.readFileSync("v2_int_deploy.json", "utf8"));
    const COTI_POD_ADDR = addrs.coti;

    const providerCoti = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    console.log(`Checking COTI Pod at: ${COTI_POD_ADDR} for CiphertextSaved events...`);

    const cotiArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessagePod.sol/DirectIntMessagePod.json", "utf8"));
    const dmPod = new ethers.Contract(COTI_POD_ADDR, cotiArtifact.abi, providerCoti);

    const filter = dmPod.filters.CiphertextSaved();
    const logs = await dmPod.queryFilter(filter, -1000); 

    console.log(`Found ${logs.length} CiphertextSaved events`);
    for (const log of logs) {
        const parsed = dmPod.interface.parseLog(log as any);
        console.log(`msgId: ${parsed.args.msgId}, recipient: ${parsed.args.recipient}`);
    }
}
main().catch(console.error);
