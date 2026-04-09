import hre from "hardhat";
import { ethers } from "ethers";
import { Wallet, JsonRpcProvider } from "@coti-io/coti-ethers";

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY missing in .env");

  const messageContent = process.env.MESSAGE_CONTENT || "HelloWorld from Perci!";
  const recipientAddr = process.env.RECIPIENT_ADDRESS || "0xa8d10a99F94a5Fecbb1A6e6C5BEe215D39063C05";

  // Connect via COTI JSON-RPC using ethers
  const url = "https://testnet.coti.io/rpc";
  
  // Use COTI implementations of Provider & Wallet
  // Wait, `coti-ethers` exports its own `Wallet`, let's just use normal JsonRpcProvider
  const provider = new ethers.JsonRpcProvider(url);
  
  // This Wallet handles Native Encryptions
  const signer = new Wallet(privateKey, provider);

  const contractAddress = "0x133608213cD92e93b589894C404841d638F692D8";
  const artifact = await hre.artifacts.readArtifact("DirectMessage");
  const contract = new ethers.Contract(contractAddress, artifact.abi, signer);

  console.log(`\n🔑 Initializing / Recovering Account Onboarding (AES Key) on testnet...`);
  await signer.generateOrRecoverAes();
  console.log(`✅ Onboard setup successful! AES key ready for private execution.`);

  console.log(`\n🔒 Encrypting message: "${messageContent}"...`);
  
  // Obtain function selector using standard Ethers interface helper
  const selector = contract.interface.getFunction("receive_message")!.selector;
  
  // Create signed encryption via coti-ethers
  const itString = await signer.encryptValue(messageContent, contractAddress, selector);

  console.log(`\n📤 Sending payload to recipient: ${recipientAddr}`);
  console.log("Submitting 'receive_message' transaction to the network...");
  
  // Fire the execution request
  const tx = await contract.receive_message(itString, recipientAddr, { gasLimit: 3000000 });
  console.log(`⏳ Tx Hash generated: ${tx.hash}`);
  console.log("Waiting for network confirmation...");
  
  const receipt = await tx.wait();
  
  // Parse the output logs to locate the Message ID
  const event = receipt?.logs.map((log: any) => {
    try {
      return contract.interface.parseLog(log);
    } catch {
      return null;
    }
  }).find((parsed: any) => parsed?.name === "MessageStored");

  if (event) {
    console.log(`\n✅ Success! `);
    console.log(`🆔 Message ID Assigned: ${event.args.messageId}`);
    console.log(`🔐 Cryptographically Bound to Recipient: ${event.args.recipient}`);
  } else {
    console.log("\n⚠️ Transaction mined, but MessageStored event not found in the logs.");
  }
}

main().catch((error) => {
  console.error("\n❌ Error sending message:", error);
  process.exitCode = 1;
});
