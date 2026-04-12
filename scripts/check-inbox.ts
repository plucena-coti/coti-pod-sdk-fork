import { ethers } from "ethers";

async function main() {
    const url = "https://testnet.coti.io/rpc";
    const provider = new ethers.JsonRpcProvider(url);
    const addr = "0xFa158f9e49C8bb77f971c3630EbCD23a8a88D14E";
    const code = await provider.getCode(addr);
    console.log("Code length:", code.length);
}
main().catch(console.error);
