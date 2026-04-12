import hre from "hardhat";
import { ethers } from "ethers";
import { Wallet } from "@coti-io/coti-ethers";
import { buildInputText } from "@coti-io/coti-sdk-typescript";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const cotiSigner = new Wallet(process.env.PRIVATE_KEY!, provider);
  await cotiSigner.generateOrRecoverAes();
  const accountAesKey = cotiSigner.getUserOnboardInfo()?.aesKey;

  const artifact = await hre.artifacts.readArtifact("DirectIntMessagePod");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  
  // A deployed inbox stub or the actual testnet executor
  const MPC_EXECUTOR = "0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c";
  
  // We deploy a fresh one to test the revert logic locally
  const testPod = await factory.deploy(deployer.address); // Make deployer the inbox so we can call it
  await testPod.waitForDeployment();
  const testPodAddress = await testPod.getAddress();
  
  console.log(`🎯 Test Int Pod deployed locally to: ${testPodAddress}`);

  const selector = new ethers.Interface(artifact.abi).getFunction("receiveMessage")!.selector;

  console.log(`Encrypting with buildInputText mapper to ${testPodAddress}...`);
  const itUint64Args = await buildInputText(
    BigInt(1337),
    { wallet: deployer, userKey: accountAesKey! },
    testPodAddress,
    selector
  );

  console.log(`Calling receiveMessage natively to trace revert...`);
  try {
    const tx = await testPod.receiveMessage(itUint64Args, deployer.address, { gasLimit: 5000000 });
    console.log(`Tx: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Success natively.");
  } catch (err: any) {
    console.error("❌ Revert:", err.data || err.message);
  }
}
main();
