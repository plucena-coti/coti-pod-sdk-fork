import { Wallet } from "@coti-io/coti-ethers";
import { ethers } from "ethers";

async function main() {
  const url = "https://testnet.coti.io/rpc";
  const provider = new ethers.JsonRpcProvider(url);
  // Use ANY dummy private key just to initialize a wallet
  const privateKey = ethers.Wallet.createRandom().privateKey;
  const signer = new Wallet(privateKey, provider);

  // Inject the user's AES key manually
  signer.setAesKey("0b5b797c50c0da83ec211b64be311e4f");
  
  const ctStringCells = [
    29025554601925448196807226740496160574777387500124944299936910953719148740877n,
    50369035172451415280120493075566178226835577850883764629812695407889468583765n,
    85018725125242849231244970039301496653930395515083138146513846179109849245507n
  ];

  try {
    console.log("Wallet Decrypt:", await signer.decryptValue({ value: ctStringCells }));
  } catch (e) {
    console.log(e);
  }
}
main().catch(console.error);
