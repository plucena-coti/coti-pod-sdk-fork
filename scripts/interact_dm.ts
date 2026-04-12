import hre from "hardhat";
import { ethers } from "ethers";
import { Wallet } from "@coti-io/coti-ethers";
import { buildStringInputText } from "@coti-io/coti-sdk-typescript";

const EVM_CONTRACT = "0xFE0E04D422DB9b5Ffb88fEbdB4c3D366C919F0bB";
const COTI_CONTRACT = "0x22a4B9248815d8Ecc62912bA343Dae953904d6d8";

async function main() {
  const privateKey = process.env.PRIVATE_KEY!;
  
  // 1. Recover AES key and COTI signer for signing the `itString`, even though we are sending on Sepolia.
  const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
  const cotiSigner = new Wallet(privateKey, cotiProvider);
  await cotiSigner.generateOrRecoverAes();
  const accountAesKey = cotiSigner.getUserOnboardInfo()?.aesKey;
  if (!accountAesKey) throw new Error("Please onboard your account to COTI testnet first.");

  console.log(`\n🔑 Coti Testnet AES key: ${accountAesKey}`);

  // 2. Setup Sepolia Provider to dispatch the transaction
  const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const sepoliaWallet = new ethers.Wallet(privateKey, sepoliaProvider);

  const dmEvmArtifact = await hre.artifacts.readArtifact("DirectMessageEvm");
  const dmEvm = new ethers.Contract(EVM_CONTRACT, dmEvmArtifact.abi, sepoliaWallet);
  
  const dmPodArtifact = await hre.artifacts.readArtifact("DirectMessagePod");
  const selector = new ethers.Interface(dmPodArtifact.abi).getFunction("receiveMessage")!.selector;

  console.log(`\n2. Encrypting Direct Message payload mapped to COTI selector [${selector}]...`);
  
  const senderContext = {
    wallet: sepoliaWallet,
    userKey: accountAesKey,
  };
  
  // Bind the itString to the specific COTI_CONTRACT and target selector!
  const itStringArgs = await buildStringInputText(
    "Hello from Sepolia with high gas!",
    senderContext,
    COTI_CONTRACT,
    selector
  );

  // Bumping gas limits aggressively for itString dynamic arrays!
  const callbackFeeWei = ethers.parseEther("0.05"); // Aggressive callback fee
  const totalWei       = ethers.parseEther("0.08"); // Aggressive total value

  console.log(`\n3. Dispatching message across the bridge to ${sepoliaWallet.address}...`);
  console.log(`   (msg.value: ${ethers.formatEther(totalWei)} ETH)`);
  
  const tx = await dmEvm.sendMessage(
    itStringArgs,
    sepoliaWallet.address, 
    callbackFeeWei,
    { value: totalWei, gasLimit: 5000000 }
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
  console.log(`\nThe MPC network will now route this encrypted message to COTI Testnet (${COTI_CONTRACT}).`);
  console.log(`\nRun: TX_HASH="${tx.hash}" npx tsx scripts/track_dm.ts\n`);
}

main().catch((error) => {
  console.error("❌ Interaction failed:", error);
  process.exitCode = 1;
});
