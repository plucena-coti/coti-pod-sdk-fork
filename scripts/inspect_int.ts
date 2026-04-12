import { ethers } from "ethers";
import { Wallet } from "@coti-io/coti-ethers";
import { buildInputText } from "@coti-io/coti-sdk-typescript";

async function main() {
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);
    const cotiSigner = new Wallet(process.env.PRIVATE_KEY!, cotiProvider);
    await cotiSigner.generateOrRecoverAes();
    const accountAesKey = cotiSigner.getUserOnboardInfo()?.aesKey;

    const senderContext = {
        wallet: wallet as any,
        userKey: accountAesKey!,
    };
    
    const selector = "0xca63cb9c"; // placeholder selector
    const payload = await buildInputText(
        BigInt(1337),
        senderContext,
        "0xb3a8d2DF02b439fb9c309143feDadA14BB2F618E",
        selector
    );
    
    console.log(payload);
}
main().catch(console.error);
