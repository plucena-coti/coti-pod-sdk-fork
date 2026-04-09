import { ethers } from "ethers";
import hre from "hardhat";
import { decryptString } from "@coti-io/coti-sdk-typescript";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error("❌ Usage: npx tsx scripts/read_client.ts <MESSAGE_ID> <ADDRESS> <AES_KEY>");
    process.exit(1);
  }

  const messageId = args[0];
  const address = args[1];
  const aesKey = args[2].replace(/^0x/, ""); // Ensure no "0x" prefix for the AES key

  // Basic Address validation
  if (!ethers.isAddress(address)) {
    throw new Error(`Invalid Ethereum address provided: ${address}`);
  }

  // Basic AES Key validation (should be 32 hex characters)
  if (!/^[0-9a-fA-F]{32}$/.test(aesKey)) {
    throw new Error("Invalid AES key format. Must be a 32-character hex string without '0x'.");
  }

  console.log(`\n🔍 Fetching Message #${messageId} for recipient ${address}...`);

  const url = "https://testnet.coti.io/rpc";
  const provider = new ethers.JsonRpcProvider(url);

  const contractAddress = "0x133608213cD92e93b589894C404841d638F692D8";
  const artifact = await hre.artifacts.readArtifact("DirectMessage");
  const contract = new ethers.Contract(contractAddress, artifact.abi, provider);

  try {
    // Load the encrypted ctString array directly from the Solidity return type
    console.log("🌐 Calling `read_message(uint256)` on COTI Network...");
    const ctMessage = await contract.read_message(messageId);
    
    // ctMessage is an Array/Result object returned by ethers. The ctString struct maps to `{ value: bigint[] }` 
    // where ctMessage[0] holds the `value` property
    const ctStringCells = ctMessage[0] as bigint[]; 

    console.log(`\n🔐 Ciphertext (ctString) received:`);
    console.log(`Length: ${ctStringCells.length} parts`);
    
    // Decrypt locally using the user-provided AES Key
    console.log(`\n🔓 Attempting Decryption using AES Key...`);
    const plaintext = decryptString({ value: ctStringCells }, aesKey);
    
    console.log(`\n✅ Message Decrypted Successfully!!`);
    console.log(`-----------------------------------`);
    console.log(`📜 "${plaintext}"`);
    console.log(`-----------------------------------`);
    
    // A little sanity warning on garbled text scenarios:
    if (plaintext.includes("") || /[^\x20-\x7E]/.test(plaintext)) {
        console.warn(`\n⚠️  WARNING: The decrypted text contains unreadable binary characters.`);
        console.warn(`COTI MPC network mathematically locked this data ONLY to the recipient who was specified during the send!`);
        console.warn(`If you sent this to someone else's address from your test wallet, ONLY THEIR AES KEY will unlock the text! Your local sender AES key cannot decrypt data mapped to someone else on the network!`);
    }

  } catch (err: any) {
    console.error("\n❌ Failed to read or decrypt the message.");
    console.error("Reason:", err.shortMessage || err.message);
  }
}

main().catch((error) => {
  console.error("🔥 Critical Script Error:", error);
  process.exitCode = 1;
});
