import hre from "hardhat";
import { ethers } from "ethers";
import { Wallet } from "@coti-io/coti-ethers";

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY missing in .env");

  const messageContent = process.env.MESSAGE_CONTENT || "HelloWorld from Perci!";
  
  // Connect via COTI JSON-RPC using ethers
  const url = "https://testnet.coti.io/rpc";
  const provider = new ethers.JsonRpcProvider(url);
  
  // This Wallet handles Native Encryptions
  const signer = new Wallet(privateKey, provider);

  // NOTE: If you encrypt specifically FOR a recipient, ONLY that recipient's 
  // recovered AES key (not the sender's) can decrypt the resulting data.
  // We're overriding to send it to the SIGNER so its OWN AES key can read it back successfully.
  const recipientAddr = signer.address;

  const contractAddress = "0x133608213cD92e93b589894C404841d638F692D8";
  const artifact = await hre.artifacts.readArtifact("DirectMessage");
  const contract = new ethers.Contract(contractAddress, artifact.abi, signer);

  console.log(`\n🔑 Initializing / Recovering Account Onboarding (AES Key) on testnet...`);
  await signer.generateOrRecoverAes();
  
  const signerAesKey = signer.getUserOnboardInfo()?.aesKey;
  console.log(`✅ AES key ready: ${signerAesKey}`);

  console.log(`\n🔒 Encrypting message: "${messageContent}"...`);
  
  const selector = contract.interface.getFunction("receive_message")!.selector;
  const itString = await signer.encryptValue(messageContent, contractAddress, selector);

  console.log(`\n📤 Sending payload, locking it EXCLUSIVELY to yourself: ${recipientAddr}`);
  console.log("Submitting 'receive_message' transaction to the network...");
  
  const tx = await contract.receive_message(itString, recipientAddr, { gasLimit: 3000000 });
  console.log(`⏳ Tx Hash generated: ${tx.hash}`);
  
  const receipt = await tx.wait();
  
  const event = receipt?.logs.map((log: any) => {
    try {
      return contract.interface.parseLog(log);
    } catch {
      return null;
    }
  }).find((parsed: any) => parsed?.name === "MessageStored");

  if (event) {
    const id = event.args.messageId.toString();
    console.log(`\n✅ Success! `);
    console.log(`🆔 Message ID Assigned: ${id}`);
    console.log(`🔐 Cryptographically Bound to Recipient: ${event.args.recipient}`);
    console.log(`\n💡 To decrypt, run the following:`);
    console.log(`npx tsx scripts/read_client.ts ${id} ${recipientAddr} ${signerAesKey}`);
  } else {
    console.log("\n⚠️ Transaction mined, but MessageStored event not found in the logs.");
  }
}

main().catch((error) => {
  console.error("\n❌ Error sending message:", error);
  process.exitCode = 1;
});
