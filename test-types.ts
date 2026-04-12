import { CotiPodCrypto, DataType } from "./src/index.js";
async function run() {
  const enc = await CotiPodCrypto.encrypt("Hello from Sepolia!", "testnet", DataType.String);
  console.log(JSON.stringify(enc, null, 2));
}
run();
