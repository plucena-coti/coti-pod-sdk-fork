import hre from "hardhat";
import { ethers } from "ethers";
import { Wallet } from "@coti-io/coti-ethers";
import { buildStringInputText } from "@coti-io/coti-sdk-typescript";

async function main() {
  const url = "https://testnet.coti.io/rpc";
  const provider = new ethers.JsonRpcProvider(url);
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  // Initialize COTI signer for AES key
  const cotiSigner = new Wallet(process.env.PRIVATE_KEY!, provider);
  await cotiSigner.generateOrRecoverAes();
  const accountAesKey = cotiSigner.getUserOnboardInfo()?.aesKey;

  const artifact = await hre.artifacts.readArtifact("DirectMessageCotiTest");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  const testPod = await factory.deploy({ gasLimit: 5000000 });
  await testPod.waitForDeployment();
  const testPodAddress = await testPod.getAddress();
  
  console.log(`🎯 DirectMessageCotiTest deployed on COTI to: ${testPodAddress}`);

  console.log(`\nEncrypting with buildStringInputText mapped to ${testPodAddress} and selector receiveMessageDirect...`);
  const senderContext = {
    wallet: deployer,
    userKey: accountAesKey!,
  };
  
  const selector = new ethers.Interface(artifact.abi).getFunction("receiveMessageDirect")!.selector;

  // The critical fix: Signature must be mapped to the actual contract being called
  const itStringArgs = await buildStringInputText(
    "Local Coti String Test!",
    senderContext,
    testPodAddress,
    selector
  );

  console.log(`\nCalling receiveMessageDirect on-chain (COTI Testnet)...`);

  try {
    // Calling the exact smart contract method we designed
    const tx = await testPod.receiveMessageDirect(
      itStringArgs,
      deployer.address, 
      { gasLimit: 5000000 }
    );
    console.log(`Transaction Hash: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log("\n✅ Execution Confirmed!");

    let eventFound = false;
    for (const log of receipt.logs) {
        try {
            const parsed = testPod.interface.parseLog(log as any);
            if (parsed && parsed.name === "CiphertextSaved") {
                eventFound = true;
                break;
            }
        } catch (e) {}
    }
    console.log("CiphertextSaved Event Emitted:", eventFound);
  } catch (err: any) {
    if (err.data) {
        console.error("❌ Revert data:", err.data);
    }
    console.error("❌ Error:", err.shortMessage || err.message);
  }
}
main().catch(console.error);
