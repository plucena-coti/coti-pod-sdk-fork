import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
  const txHash = "0x821a043ad7f3977e6aa661764118c2ee7c858c4186f63d683e41d6fe4ea45b83";
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
      console.log("Transaction is still pending...");
      return;
  }
  console.log("Status:", receipt.status === 1 ? "Success (1)" : "Failed (0)");
  console.log("Logs Length:", receipt.logs.length);
}
main().catch(console.error);
