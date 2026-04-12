import { buildStringInputText } from "@coti-io/coti-sdk-typescript";
import { ethers, Wallet } from "ethers";

async function main() {
    const w = new Wallet("0x" + "1".repeat(64));
    const sender = { wallet: w, userKey: "86f6ca0fb3c6bba2c3eadae8d6b70cdd" };
    const it = await buildStringInputText("Short", sender, "0xDe6466c5C7B81d995C18B2a57036Bc7a6857a1e8", "0x0928a471");
    console.log(it);
}
main();
