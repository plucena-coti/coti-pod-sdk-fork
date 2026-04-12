import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const sepolia = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const coti = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    
    // The Inbox address
    const inboxAddr = "0xFa158f9e49C8bb77f971c3630EbCD23a8a88D14E"; 

    console.log("Sepolia inbox code Len:", (await sepolia.getCode(inboxAddr)).length);
    console.log("COTI inbox code Len:", (await coti.getCode(inboxAddr)).length);

    // The MPC Executor
    const mpcExecutor = "0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c"; 
    console.log("Sepolia MPC code Len:", (await sepolia.getCode(mpcExecutor)).length);
    console.log("COTI MPC code Len:", (await coti.getCode(mpcExecutor)).length);
}
main().catch(console.error);
