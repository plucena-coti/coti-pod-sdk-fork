import { ethers } from "ethers";
async function main() {
    const provider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const MPC_EXECUTOR = "0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c";
    const nonce = await provider.getTransactionCount(MPC_EXECUTOR);
    console.log("MPC_EXECUTOR nonce:", nonce);
}
main().catch(console.error);
