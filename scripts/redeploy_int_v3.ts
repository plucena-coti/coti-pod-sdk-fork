import { ethers } from "ethers";
import * as fs from "fs";
import hre from "hardhat";

async function main() {
    const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    
    const evmWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);
    const cotiWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);

    console.log("Compiling contracts...");
    // Let's run a hardhat compile via command line wrapper. Oh wait, we will compile in terminal before running.

    console.log("\n1. Deploying DirectIntMessagePod to COTI Testnet...");
    const cotiArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessagePod.sol/DirectIntMessagePod.json", "utf8"));
    const cotiFactory = new ethers.ContractFactory(cotiArtifact.abi, cotiArtifact.bytecode, cotiWallet);
    const MPC_EXECUTOR = "0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c"; 

    const cotiContract = await cotiFactory.deploy(MPC_EXECUTOR);
    await cotiContract.waitForDeployment();
    const COTI_POD_ADDR = await cotiContract.getAddress();
    console.log(`✅ COTI Pod Deployed to: ${COTI_POD_ADDR}`);

    console.log("\n2. Deploying DirectIntMessageEvm to Sepolia...");
    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
    const evmFactory = new ethers.ContractFactory(evmArtifact.abi, evmArtifact.bytecode, evmWallet);

    const evmContract = await evmFactory.deploy();
    await evmContract.waitForDeployment();
    const EVM_ADDR = await evmContract.getAddress();
    console.log(`✅ Sepolia EVM Deployed to: ${EVM_ADDR}`);

    console.log("\n3. Linking EVM to COTI Pod...");
    const txLink = await (evmContract as any).setCotiContract(COTI_POD_ADDR);
    await txLink.wait();
    console.log("✅ Cross-chain linking complete!");

    // Save for next runs
    fs.writeFileSync("v3_int_deploy.json", JSON.stringify({ evm: EVM_ADDR, coti: COTI_POD_ADDR }, null, 2));
}

main().catch(console.error);
