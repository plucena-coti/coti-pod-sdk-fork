import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
    console.log("1. Deploying DirectMessagePod to COTI Testnet...");
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const cotiWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);

    const artifactPod = await hre.artifacts.readArtifact("DirectMessagePod");
    const podFactory = new ethers.ContractFactory(artifactPod.abi, artifactPod.bytecode, cotiWallet);
    
    // The true Inbox on COTI Testnet
    const COTI_INBOX = "0x0f9a5cd00450db1217839c35d23d56f96d6331ae"; 
    
    const podContract = await podFactory.deploy(COTI_INBOX, { gasLimit: 5000000 });
    await podContract.waitForDeployment();
    const podAddress = await podContract.getAddress();
    console.log(`✅ DirectMessagePod deployed to: ${podAddress}`);


    console.log("\n2. Deploying DirectMessageEvm to EVM (Sepolia)...");
    const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);

    const artifactEvm = await hre.artifacts.readArtifact("DirectMessageEvm");
    const evmFactory = new ethers.ContractFactory(artifactEvm.abi, artifactEvm.bytecode, sepoliaWallet);
    const evmContract = await evmFactory.deploy();
    await evmContract.waitForDeployment();
    const evmAddress = await evmContract.getAddress();
    console.log(`✅ DirectMessageEvm deployed to: ${evmAddress}`);

    console.log("\n3. Linking EVM to COTI Pod...");
    const tx = await evmContract.setCotiContract(podAddress);
    await tx.wait();
    console.log("✅ Link complete! Evm contract is ready to go.");

    console.log("\nDeployment Summary:");
    console.log(`DirectMessageEvm (Sepolia): ${evmAddress}`);
    console.log(`DirectMessagePod (COTI): ${podAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
