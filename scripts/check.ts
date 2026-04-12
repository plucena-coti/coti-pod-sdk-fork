import { CotiPodCrypto, DataType } from "../src/index.js";

async function main() {
  const encryptedPayload = (await CotiPodCrypto.encrypt(
    "Hello from Sepolia!", 
    "testnet", 
    DataType.String
  )) as any;
  
  console.log("ciphertext:", encryptedPayload.ciphertext.value);
  console.log("signature:", encryptedPayload.signature);
}
main();
