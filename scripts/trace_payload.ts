import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";

async function main() {
    const txHash = "0x7a069c9bb44802b53e4a10e29e5d195fd7636dee6d10b2c09f01bfc8d42d4d5d";
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const tx = await provider.getTransaction(txHash);

    const artifact = JSON.parse(fs.readFileSync("./artifacts/contracts/examples/DirectMessageEvm.sol/DirectMessageEvm.json", "utf-8"));
    const intrf = new ethers.Interface(artifact.abi);
    
    // Also look at the `sendMessage` function 
    const func = intrf.getFunction("sendMessage");
    console.log("ABI for sendMessage:");
    console.log(func?.inputs.map(i => `${i.name}: ${i.format()}`));
    
    console.log("\nDecoded tx input:");
    const decoded = intrf.parseTransaction({ data: tx!.data });
    console.log(JSON.stringify(decoded?.args, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));

}

main().catch(console.error);
