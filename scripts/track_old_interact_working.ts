import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  
  const contractAddress = "0x2aA07A3A4FCDdb8D64febF61e7cfDEF79Fa0b6f9";
  const txHash = "0x204af5376ad07e032858c5d58639cde6f215f49e2d87decb834cbd43618da530"; // From the interact.ts run
  const requestId = "0x00000000000000000000000000aa36a700000000000000000000000000000058";
  
  const artifact = await hre.artifacts.readArtifact("PrivateAdder");
  const privateAdder = new ethers.Contract(contractAddress, artifact.abi, provider);

  console.log(`Checking status for PrivateAdder at ${contractAddress}`);
  console.log(`Tracking RequestId: ${requestId}`);
  console.log(`From Tx Hash: ${txHash}\n`);

  const statusMap = ["None (0)", "Pending (1)", "Completed (2)"];
  
  const status = await privateAdder.statusByRequest(requestId);
  console.log(`Current Status: ${statusMap[Number(status)] || status}`);

  if (status === 2n /* Completed */) {
      const ct = await privateAdder.sumByRequest(requestId);
      console.log(`Encrypted Sum: 0x${ct.toString(16)}`);
  } else {
      console.log("\n⚠️ The request is still stuck in Pending.");
      console.log("This confirms that the generic CotiPodCrypto.encrypt() without strict target address & function selector binding expects to fail on the MPC side.");
  }
}

main().catch(console.error);
