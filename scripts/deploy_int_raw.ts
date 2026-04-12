import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
  const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
  const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const walletCoti = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);
  const walletSep = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);

  console.log("Reading artifacts...");
  const podArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessagePod.sol/DirectIntMessagePod.json", "utf8"));
  const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));

  const nonceCoti = await cotiProvider.getTransactionCount(walletCoti.address, "pending");
  console.log(`COTI Nonce: ${nonceCoti}`);
  
  const factoryPod = new ethers.ContractFactory(podArtifact.abi, podArtifact.bytecode, walletCoti);
  console.log("Deploying Pod to COTI...");
  const pod = await factoryPod.deploy("0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c", { nonce: nonceCoti });
  console.log(`Pod tx hash: ${pod.deploymentTransaction()?.hash}`);
  await pod.waitForDeployment();
  console.log(`✅ DirectIntMessagePod deployed to COTI @ ${await pod.getAddress()}`);

  const nonceSep = await sepoliaProvider.getTransactionCount(walletSep.address, "pending");
  console.log(`SEPOLIA Nonce: ${nonceSep}`);

  const factoryEvm = new ethers.ContractFactory(evmArtifact.abi, evmArtifact.bytecode, walletSep);
  console.log("Deploying EVM to Sepolia...");
  const evm = await factoryEvm.deploy({ nonce: nonceSep });
  console.log(`EVM tx hash: ${evm.deploymentTransaction()?.hash}`);
  await evm.waitForDeployment();
  console.log(`✅ DirectIntMessageEvm deployed to Sepolia @ ${await evm.getAddress()}`);
}

main().catch(console.error);
