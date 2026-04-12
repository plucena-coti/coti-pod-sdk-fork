import { CotiPodCrypto, DataType } from "../src/index.js";
async function main() {
  const result = await CotiPodCrypto.encrypt("Hello From Sepolia", "testnet", DataType.String) as any;
  console.log("Ciphertext Type:", typeof result.ciphertext.value, Array.isArray(result.ciphertext.value));
  console.log("Signature Type:", typeof result.signature, Array.isArray(result.signature));
  console.log("Signature Length:", result.signature.length);
  if (Array.isArray(result.signature)) {
    console.log("First element:", result.signature[0]);
  } else {
    console.log("Value:", result.signature);
  }
}
main();
