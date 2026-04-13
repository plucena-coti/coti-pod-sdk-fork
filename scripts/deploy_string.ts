import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    
    const cotiWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);
    const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);

    console.log("1. Deploying StringMatcherPod to COTI Testnet...");
    const podArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/StringMatcherPod.sol/StringMatcherPod.json", "utf8"));
    const podFactory = new ethers.ContractFactory(podArtifact.abi, podArtifact.bytecode, cotiWallet);
    const MPC_EXECUTOR = "0x0F9A5cD00450db1217839C35d23D56F96d6331ae"; // Inbox Relayer on COTI
    const podContract = await podFactory.deploy(MPC_EXECUTOR, { gasLimit: 5000000 });
    await podContract.waitForDeployment();
    const podAddress = await podContract.getAddress();
    console.log(`✅ StringMatcherPod deployed to: ${podAddress}`);

    console.log("\n2. Deploying StringMatcherEvm to Sepolia...");
    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/StringMatcherEvm.sol/StringMatcherEvm.json", "utf8"));
    const evmFactory = new ethers.ContractFactory(evmArtifact.abi, evmArtifact.bytecode, sepoliaWallet);
    const evmContract = await evmFactory.deploy();
    await evmContract.waitForDeployment();
    const evmAddress = await evmContract.getAddress();
    console.log(`✅ StringMatcherEvm deployed to: ${evmAddress}`);

    console.log("\n3. Linking Sepolia Contract to COTI Contract...");
    const tx = await (evmContract as any).setCotiContract(podAddress);
    await tx.wait();
    console.log("✅ Linkage updated.");

    const deployment = { evmAddress, podAddress };
    fs.writeFileSync("string_deploy.json", JSON.stringify(deployment, null, 2));
    console.log("\nDeployment addresses saved to string_deploy.json");
}

main().catch(console.error);
