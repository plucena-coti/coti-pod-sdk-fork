import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  
  // The contract address of your deployed StringMatcherEvm
  const contractAddress = "0xd7656ACACE5Ab0081f453047DA514283928db544";
  
  // The requestId from your previous run
  const requestId = "0x00000000000000000000000000aa36a700000000000000000000000000000061";

  const artifact = await hre.artifacts.readArtifact("StringMatcherEvm");
  const matcher = new ethers.Contract(contractAddress, artifact.abi, provider);

  console.log(`Polling status for Request ID: ${requestId}...`);

  const status = await matcher.statusByRequest(requestId);
  console.log(`Current Status mapping (0=None, 1=Pending, 2=Completed, 3=Failed): ${status}`);

  if (status === 2n /* Completed */) {
    const ctResult = await matcher.resultByRequest(requestId);
    console.log(`\n✅ Execution Completed!`);
    
    const ctHex = "0x" + ctResult.toString(16);
    console.log(`Encrypted Boolean Result (ctBool uint256 representation):`);
    console.log(ctHex);
  } else if (status === 3n) {
    console.log(`\n❌ Execution Failed.`);
  } else {
    console.log(`\n⏳ Request is still pending...`);
  }
}

main().catch(console.error);
