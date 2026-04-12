import { ethers } from "ethers";

async function main() {
    const sepolia = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const coti = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    
    // The Inbox address
    const inboxAddr = "0xFa158f9e49C8bb77f971c3630EbCD23a8a88D14E"; // From PodUserSepolia

    console.log("Sepolia:", await sepolia.getCode(inboxAddr));
    console.log("COTI:", await coti.getCode(inboxAddr));

    // The MPC Executor
    const mpcExecutor = "0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c"; // From PodUserSepolia
    console.log("Sepolia MPC:", await sepolia.getCode(mpcExecutor));
    console.log("COTI MPC:", await coti.getCode(mpcExecutor));
}
main().catch(console.error);
