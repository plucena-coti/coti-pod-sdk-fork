import { ethers } from "ethers";

async function main() {
    const COTI_POD_ADDR = "0xb3a8d2DF02b439fb9c309143feDadA14BB2F618E";
    const provider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    
    const code = await provider.getCode(COTI_POD_ADDR);
    console.log(`Code length at ${COTI_POD_ADDR}: ${code.length}`);

    // Let's also check if inbox is set!
    const contract = new ethers.Contract(COTI_POD_ADDR, ["function inbox() view returns (address)"], provider);
    const inboxAddr = await contract.inbox();
    console.log(`Inbox mapped inside Pod contract: ${inboxAddr}`);
    
    const MPC_EXECUTOR = "0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c";
    console.log(`Is it MPC EXECUTOR? ${inboxAddr.toLowerCase() === MPC_EXECUTOR.toLowerCase()}`);
}
main().catch(console.error);
