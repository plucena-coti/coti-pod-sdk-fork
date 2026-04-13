import hre from "hardhat";
import { ethers } from "ethers";
import { CotiPodCrypto, DataType } from "@coti/pod-sdk";

async function main() {
  const privateKey = process.env.PRIVATE_KEY!;
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Deployed StringMatcherEvm
  const contractAddress = "0xd7656ACACE5Ab0081f453047DA514283928db544";

  const artifact = await hre.artifacts.readArtifact("StringMatcherEvm");
  const matcher = new ethers.Contract(contractAddress, artifact.abi, wallet);

  console.log("1. Encrypting string guess...");
  
  const guess = "hello_coti_123";
  const encryptedPayload = await CotiPodCrypto.encrypt(guess, "testnet", DataType.String) as any;
  
  // The SDK returned an array of signatures, but `itString` struct signature is `bytes`.
  // So we concat the signatures if there are multiple parts.
  let formattedCiphertext = encryptedPayload.ciphertext.value || encryptedPayload.ciphertext;
  if (!Array.isArray(formattedCiphertext)) {
      formattedCiphertext = [formattedCiphertext];
  }
  
  let formattedSignature = encryptedPayload.signature;
  if (!Array.isArray(formattedSignature)) {
      formattedSignature = [formattedSignature];
  }
  formattedSignature = formattedSignature.map((sig: string) => sig.startsWith("0x") ? sig : "0x" + sig);

  const itStringArgs = {
      ciphertext: {
          value: formattedCiphertext.map((c: any) => {
              if (typeof c === "bigint") return c;
              return typeof c === "string" && !c.startsWith("0x") ? "0x" + c : c;
          })
      },
      signature: formattedSignature,
  };

  const callbackFeeWei = ethers.parseEther("0.02"); 
  const totalWei       = ethers.parseEther("0.035"); 

  console.log("2. Submitting 'matchGuess' transaction...");
  try {
      const tx = await matcher.matchGuess(
        itStringArgs,
        wallet.address, // recipient
        callbackFeeWei,
        { value: totalWei, gasLimit: 3000000 }
      );
    
      console.log(`Tx Hash: ${tx.hash}`);
      const receipt = await tx.wait();
    
      let requestId = null;
      for (const log of receipt.logs) {
          try {
              const parsed = matcher.interface.parseLog(log as any);
              if (parsed && parsed.name === "MatchRequested") {
                  requestId = parsed.args.requestId;
                  break;
              }
          } catch (e) {}
      }
      
      console.log(`Found RequestId: ${requestId}`);
      console.log("3. Waiting for asynchronous execution (polling RequestStatus)...");
      
      for (let i = 0; i < 20; i++) {
        const status = await matcher.statusByRequest(requestId);
        if (status === 2n /* Completed */) {
          const ctResult = await matcher.resultByRequest(requestId);
          console.log(`\n✅ Execution Completed!`);
          
          const ctHex = "0x" + ctResult.toString(16);
          console.log(`Encrypted Boolean Result (ctBool uint256 representation):`);
          console.log(ctHex);
          return;
        }
        
        process.stdout.write("Status pending... waiting 5 seconds...\r");
        await new Promise((r) => setTimeout(r, 5000));
      }
  } catch (err:any) {
      console.error(err);
  }
}

main().catch(console.error);
