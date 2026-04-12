import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "../src/index.js";
import * as fs from "fs";

const COTI_POD_ADDR = "0xb3a8d2DF02b439fb9c309143feDadA14BB2F618E";
const EVM_ADDR = "0xA2Ff922da0b4BF178B5A94679C96a17082585B5f";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
  const dmEvm = new ethers.Contract(EVM_ADDR, evmArtifact.abi, wallet);

  console.log("1. Correcting the Coti Contract linkage on Sepolia EVM...");
  console.log(`Updating Coti contract to ${COTI_POD_ADDR}`);
  const txSet = await dmEvm.setCotiContract(COTI_POD_ADDR);
  await txSet.wait();
  console.log("✅ Linkage updated.");

  console.log("\n2. Encrypting Direct Message payload (Uint64)...");
  
  // We encrypt an integer (e.g. 1337)
  const messageInt = 1337;
  const encryptedPayload = (await CotiPodCrypto.encrypt(
    messageInt, 
    "testnet", 
    DataType.Uint64
  )) as any;
  
  // `itUint64` requires { ciphertext: uint256, signature: bytes }
  const itUint64Args = {
      ciphertext: "0x" + BigInt(encryptedPayload.ciphertext).toString(16).padStart(64, "0"),
      signature: encryptedPayload.signature.startsWith("0x") ? encryptedPayload.signature : "0x" + encryptedPayload.signature,
  };

  const callbackFeeWei = ethers.parseEther("0.001"); 
  const totalWei       = ethers.parseEther("0.005"); 

  console.log(`\n3. Dispatching integer message across the bridge to ${wallet.address}...`);
  console.log(`   (msg.value: ${ethers.formatEther(totalWei)} ETH)`);
  
  const tx = await dmEvm.sendMessage(
    itUint64Args,
    wallet.address, 
    callbackFeeWei,
    { value: totalWei, gasLimit: 2500000 }
  );

  console.log("Transaction Hash:", tx.hash);
  console.log("Waiting for confirmation on Sepolia...");
  const receipt = await tx.wait();

  let requestId = null;
  for (const log of receipt.logs) {
      try {
          const parsed = dmEvm.interface.parseLog(log as any);
          if (parsed && parsed.name === "MessageDispatched") {
              requestId = parsed.args.requestId;
              break;
          }
      } catch (e) {}
  }

  console.log("\n✅ Dispatch confirmed!");
  console.log(`Bridge RequestId: ${requestId}`);
  console.log(`\nThe MPC network will now route this encrypted message to COTI Testnet (${COTI_POD_ADDR}).`);
  console.log(`You can monitor the callback on Sepolia via the 'MessageReply' event for this RequestId!`);
}

main().catch(console.error);
