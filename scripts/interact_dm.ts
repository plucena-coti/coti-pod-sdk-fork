import hre from "hardhat";
import { ethers } from "ethers";
import { Wallet } from "@coti-io/coti-ethers";
import { buildStringInputText } from "@coti-io/coti-sdk-typescript";

const EVM_CONTRACT = "0x6CcA577c51C878c64510CCb782F99eAE7d698d72";
const COTI_CONTRACT = "0xDe6466c5C7B81d995C18B2a57036Bc7a6857a1e8";

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
  
  // 3. Build the itString properly using the SDK
  const senderContext = {
    wallet: sepoliaWallet,
    userKey: accountAesKey,
  };
  
  // CRITICAL FIX: The itString must be bound to the COTI_CONTRACT and the specific receiveMessage selector!
  const itStringArgs = await buildStringInputText(
    "Short message",
    senderContext,
    COTI_CONTRACT,
    selector
  );

  // The struct is ready. Now dispatch it over the bridge!
  const callbackFeeWei = ethers.parseEther("0.001"); 
  const totalWei       = ethers.parseEther("0.004"); 

  console.log(`\n3. Dispatching message across the bridge to ${sepoliaWallet.address}...`);
  console.log(`   (msg.value: ${ethers.formatEther(totalWei)} ETH)`);
  
  const tx = await dmEvm.sendMessage(
    itStringArgs,
    sepoliaWallet.address, 
    callbackFeeWei,
    { value: totalWei, gasLimit: 3000000 }
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
}

main().catch((error) => {
  console.error("❌ Interaction failed:", error);
  process.exitCode = 1;
});
