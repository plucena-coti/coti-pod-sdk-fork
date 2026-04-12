import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const address = "0xDe6466c5C7B81d995C18B2a57036Bc7a6857a1e8";
    const logs = await provider.getLogs({
        address: address,
        fromBlock: 0,
        toBlock: "latest"
    });
    console.log("Total events found on Coti Pod:", logs.length);
    for (const log of logs) {
        console.log("Top level Log:", log.transactionHash, "Block:", log.blockNumber);
    }
}
main().catch(console.error);
