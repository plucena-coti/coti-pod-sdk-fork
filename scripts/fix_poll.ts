import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const StringMatcherEvmAddr = "0xd7656ACACE5Ab0081f453047DA514283928db544";
  const artifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/StringMatcherEvm.sol/StringMatcherEvm.json", "utf8"));
  const matcher = new ethers.Contract(StringMatcherEvmAddr, artifact.abi, provider);
  
  const req = "0x00000000000000000000000000aa36a700000000000000000000000000000064";
  const s = await matcher.statusByRequest(req);
  console.log("Status:", s);
  if (s == 2) {
    console.log("Result:", await matcher.resultByRequest(req));
  } else if (s == 3) {
    console.log("Failed");
  }
}
main().catch(console.error);
