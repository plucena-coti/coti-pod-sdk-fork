import hre from "hardhat";
import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "../src/index";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  
  const contractAddress = process.env.DIRECT_EVM || "CHANGE_ME";
  if (contractAddress === "CHANGE_ME") {
      console.log("❌ Please pass contract address via DIRECT_EVM");
      process.exit(1);
  }
  
  const txHash = process.env.TX_HASH;
  if (!txHash) {
      console.error("❌ Please provide a transaction hash via the TX_HASH environment variable.");
      process.exit(1);
  }

  const artifact = await hre.artifacts.readArtifact("DirectMessageEvm");
  const directMessage = new ethers.Contract(contractAddress, artifact.abi, provider);

  console.log(`1. Fetching transaction receipt for: ${txHash}`);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
     console.error("Receipt not found. Make sure the RPC URL is correct and the TX was mined.");
     return;
  }

  let requestId = null;
  let sender = null;
  let recipient = null;
  for (const log of receipt.logs) {
      try {
          const parsed = directMessage.interface.parseLog(log as any);
          if (parsed && parsed.name === "MessageDispatched") {
              requestId = parsed.args.requestId;
              sender = parsed.args.sender;
              recipient = parsed.args.recipient;
              break;
          }
      } catch (e) {}
  }

  if (!requestId) {
      console.error("❌ Could not find a 'MessageDispatched' event in this transaction.");
      return;
  }

  console.log(`2. Found RequestId: ${requestId}`);
  console.log(`   Sender:    ${sender}`);
  console.log(`   Recipient: ${recipient}`);
  console.log(`3. Polling status for Request ID: ${requestId}...`);

  const status = await directMessage.statusByRequest(requestId);
  console.log(`Current Status mapping (0=None, 1=Pending, 2=Completed, 3=Failed): ${status}`);

  if (status === 2n /* Completed */) {
    const statusMsg = await directMessage.statusMsgByRequest(requestId);
    console.log(`\n✅ Execution Completed!`);
    console.log(`Returned Status Message from COTI: "${statusMsg}"`);

    // Look for the MessageReply event to show the encrypted message details
    console.log(`\n4. Searching for MessageReply callback event...`);
    const filter = directMessage.filters.MessageReply(null, null, null);
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = receipt.blockNumber;

    // Query in chunks of 5 blocks to respect RPC provider limits
    const CHUNK_SIZE = 5;
    let replyEvent = null;
    for (let start = fromBlock; start <= currentBlock && !replyEvent; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE - 1, currentBlock);
      const events = await directMessage.queryFilter(filter, start, end);
      replyEvent = events.find((e: any) => {
        const parsed = directMessage.interface.parseLog(e as any);
        return parsed && parsed.args.originalId === requestId;
      }) || null;
    }

    if (replyEvent) {
      const parsed = directMessage.interface.parseLog(replyEvent as any);
      if (parsed) {
        console.log(`\n📨 MessageReply Event Found:`);
        console.log(`   Callback RequestId: ${parsed.args.requestId}`);
        console.log(`   Original RequestId: ${parsed.args.originalId}`);
        console.log(`   Status:             "${parsed.args.status}"`);
        // Fetch the encrypted message from COTI
        console.log(`\n5. Fetching encrypted message from COTI...`);
        const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
        const podAddress = process.env.DIRECT_POD;
        if (podAddress) {
          const podArtifact = await hre.artifacts.readArtifact("DirectMessagePod");
          const podContract = new ethers.Contract(podAddress, podArtifact.abi, cotiProvider);
          try {
            const ctMessage = await podContract.getMessage(parsed.args.originalId);
            const hexValues = ctMessage.value
              ? ctMessage.value.map((v: any) => typeof v === "bigint" ? "0x" + v.toString(16) : String(v))
              : (Array.isArray(ctMessage) ? ctMessage : [ctMessage]).map((v: any) => typeof v === "bigint" ? "0x" + v.toString(16) : String(v));

            console.log(`\n🔐 Encrypted Message (${hexValues.length} chunks):`);
            hexValues.forEach((h: string, i: number) => console.log(`   [${i}] ${h}`));

            // Decrypt if AES_KEY is provided
            const aesKey = process.env.AES_KEY;
            if (aesKey) {
              console.log(`\n6. Decrypting message...`);
              try {
                const plaintext = CotiPodCrypto.decrypt({ value: hexValues }, aesKey, DataType.String);
                console.log(`\n✉️  Decrypted Message: "${plaintext}"`);
              } catch (e: any) {
                console.error(`   ❌ Decryption failed: ${e.message || e}`);
              }
            } else {
              console.log(`\n   ℹ️  Set AES_KEY in .env to decrypt the message.`);
            }
          } catch (e: any) {
            console.log(`   ⚠️ Could not fetch encrypted message: ${e.message || e}`);
          }
        } else {
          console.log(`   ℹ️  Set DIRECT_POD in .env to the DirectMessagePod address on COTI to fetch the encrypted message.`);
        }
      }
    } else {
      console.log(`   No MessageReply event found yet — the callback may still be in transit.`);
    }
  } else if (status === 3n) {
    console.log(`\n❌ Execution Failed. Check the COTI network explorer for the Inbox Error.`);
  } else {
    console.log(`\n⏳ Request is still pending... relayer may be taking time.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
