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
  const accountAesKey = "86f6ca0fb3c6bba2c3eadae8d6b70cdd"; 

  const artifact = await hre.artifacts.readArtifact("PrivateAdder");
  const privateAdder = new ethers.Contract(contractAddress, artifact.abi, wallet);

  console.log("1. Encrypting inputs...");
  const encA = await CotiPodCrypto.encrypt("10", "testnet", DataType.Uint64);
  const encB = await CotiPodCrypto.encrypt("20", "testnet", DataType.Uint64);

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

  let requestId = null;
  for (const log of receipt.logs) {
      try {
          const parsed = privateAdder.interface.parseLog(log as any);
          if (parsed && parsed.name === "AddRequested") {
              requestId = parsed.args.requestId;
              break;
          }
      } catch (e) {}
  }
  
  console.log("Found RequestId:", requestId);
  console.log("3. Waiting for asynchronous execution (polling RequestStatus)...");
  
  for (let i = 0; i < 20; i++) {
    const status = await privateAdder.statusByRequest(requestId);
    if (status === 2n /* Completed */) {
      const encryptedSum = await privateAdder.sumByRequest(requestId);
      console.log(`\n✅ Execution Completed!`);
      const sumHex = "0x" + encryptedSum.toString(16);
      console.log(`Encrypted Sum: ${sumHex}`);
      
      console.log("\n4. Decrypting Result:");
      try {
        const decryptedSum = CotiPodCrypto.decrypt(sumHex, accountAesKey, DataType.Uint64);
        console.log(`Plaintext Sum: ${decryptedSum}`);
      } catch (err: any) {
        console.error("Decryption failed. This happens if the accountAesKey above doesn't match the one that signed the payloads.", err.message);
      }
      return;
    }
    
    process.stdout.write("Status pending... waiting 5 seconds\r");
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log("\nTimeout waiting for relayer completion. Check status manually later.");
}

main().catch(console.error);
