import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const COTI_CONTRACT = "0xDe6466c5C7B81d995C18B2a57036Bc7a6857a1e8";
    
    const podArtifact = await hre.artifacts.readArtifact("DirectMessagePod");
    const podContract = new ethers.Contract(COTI_CONTRACT, podArtifact.abi, cotiProvider);
    
    console.log("Checking events on COTI Testnet...");
    const filter = podContract.filters.CiphertextSaved();
    // Query last 1000 blocks to be safe
    const latest = await cotiProvider.getBlockNumber();
    const logs = await podContract.queryFilter(filter, latest - 1000, "latest");
    
    console.log(`Found ${logs.length} events!`);
    logs.forEach((log: any) => {
        console.log(`Message ID: ${log.args.msgId}, Recipient: ${log.args.recipient}`);
    });
}
main();
