import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
    const url = "https://testnet.coti.io/rpc";
    const provider = new ethers.JsonRpcProvider(url);
    const COTI_CONTRACT = "0xDe6466c5C7B81d995C18B2a57036Bc7a6857a1e8";
    
    const artifact = await hre.artifacts.readArtifact("DirectMessagePod");
    const podContract = new ethers.Contract(COTI_CONTRACT, artifact.abi, provider);

    console.log("Fetching past events...");
    const filter = podContract.filters.CiphertextSaved();
    const currentBlock = await provider.getBlockNumber();
    const events = await podContract.queryFilter(filter, Math.max(0, currentBlock - 10000), "latest");
    
    events.forEach((log: any) => {
        console.log(`MsgId: ${log.args.msgId}  Recipient: ${log.args.recipient}`);
    });
}
main();
