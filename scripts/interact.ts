import hre from "hardhat";
import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "@coti/pod-sdk";

// Helper function from the tutorial
function toItUint64(enc: { ciphertext: string | bigint; signature: string }) {
  return {
    ciphertext: typeof enc.ciphertext === "bigint"
      ? enc.ciphertext
      : BigInt(enc.ciphertext),
    signature: enc.signature,
  };
}

async function main() {
  const privateKey = process.env.PRIVATE_KEY!;
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Replace with your actual deployed contract address and AES key
  const contractAddress = "0x2aA07A3A4FCDdb8D64febF61e7cfDEF79Fa0b6f9";
  // Simulated AES Key for user. In a real app this is derived by user-onboarding.
  const accountAesKey = "0x0000000000000000000000000000000000000000000000000000000000000000"; 

  const artifact = await hre.artifacts.readArtifact("PrivateAdder");
  const privateAdder = new ethers.Contract(contractAddress, artifact.abi, wallet);

  console.log("1. Encrypting inputs...");
  const encA = await CotiPodCrypto.encrypt("10", "testnet", DataType.Uint64);
  const encB = await CotiPodCrypto.encrypt("20", "testnet", DataType.Uint64);

  // 2. Budget fees (Using safer higher values based on our Inbox Oracle simulation)
  const callbackFeeWei = ethers.parseEther("0.008");
  const totalWei       = ethers.parseEther("0.015");

  console.log("2. Submitting 'add' transaction...");
  const tx = await privateAdder.add(
    toItUint64(encA),
    toItUint64(encB),
    callbackFeeWei,
    { value: totalWei }
  );

  console.log("Tx Hash:", tx.hash);
  const receipt = await tx.wait();

  // 3. Extract the RequestId
  const requestId = receipt?.logs
    .map((log: any) => {
      try {
        return privateAdder.interface.parseLog(log)?.args.requestId;
      } catch {
        return null;
      }
    })
    .find(Boolean);

  console.log("Found RequestId:", requestId);
  
  if (!requestId) return;

  // 4. Poll wait for the asynchronous callback to finish
  console.log("3. Waiting for asynchronous execution (polling RequestStatus)...");
  while (true) {
    // Check status map: 0=None, 1=Pending, 2=Completed
    const status = await privateAdder.statusByRequest(requestId);
    if (status === 2n /* Completed */) {
        console.log("PoD Operation completed!");
        break;
    }
    console.log("Status pending... waiting 5 seconds");
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // 5. Read the ciphertext sum
  const ct = await privateAdder.sumByRequest(requestId);
  const ctHex = typeof ct === "bigint" ? "0x" + ct.toString(16) : String(ct);

  console.log("4. Encrypted result length:", ctHex.length);

  // 6. Decrypt the result
  try {
     const decryptedString = CotiPodCrypto.decrypt(ctHex, accountAesKey, DataType.Uint64);
     console.log("5. Decrypted sum:", decryptedString); 
  } catch (error) {
     console.error("Decryption failed. (Ensure you have a real valid user accountAesKey).", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
