import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
    const addrs = JSON.parse(fs.readFileSync("v2_int_deploy.json", "utf8"));
    const COTI_POD_ADDR = addrs.coti;

    const providerCoti = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    console.log(`Checking COTI Pod at: ${COTI_POD_ADDR} for DirectMessageReceived events...`);

    const cotiArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessagePod.sol/DirectIntMessagePod.json", "utf8"));
    const dmPod = new ethers.Contract(COTI_POD_ADDR, cotiArtifact.abi, providerCoti);

    const filter = dmPod.filters.DirectMessageReceived();
    const logs = await dmPod.queryFilter(filter, -1000); // 1000 blocks

    console.log(`Found ${logs.length} DirectMessageReceived events`);
    for (const log of logs) {
        const parsed = dmPod.interface.parseLog(log as any);
        console.log(`MessageId: ${parsed.args.messageId}`);
    }
}
main().catch(console.error);
