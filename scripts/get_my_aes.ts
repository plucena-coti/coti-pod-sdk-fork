import { ethers } from "ethers";
import { Wallet } from "@coti-io/coti-ethers";

async function main() {
  const url = "https://testnet.coti.io/rpc";
  const provider = new ethers.JsonRpcProvider(url);
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY not set");

  const wallet = new Wallet(privateKey, provider);
  await wallet.generateOrRecoverAes();
  console.log("Your AES Key:");
  console.log(wallet.getUserOnboardInfo()?.aesKey);
}

main().catch(console.error);
