import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    
    const cotiWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);
    const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);

    console.log("1. Deploying DirectIntMessagePod to COTI Testnet...");
    const podArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessagePod.sol/DirectIntMessagePod.json", "utf8"));
    const podFactory = new ethers.ContractFactory(podArtifact.abi, podArtifact.bytecode, cotiWallet);
    const MPC_EXECUTOR = "0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c";
    
    let podContract;
    try {
        podContract = await podFactory.deploy(MPC_EXECUTOR, { gasLimit: 5000000 });
        await podContract.waitForDeployment();
    } catch (e) {
        console.error("COTI Pod deployment failed:", e);
        return;
    }
    const podAddress = await podContract.getAddress();
    console.log(`✅ DirectIntMessagePod deployed to: ${podAddress}`);

    console.log("\n2. Deploying DirectIntMessageEvm to Sepolia...");
    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
    const evmFactory = new ethers.ContractFactory(evmArtifact.abi, evmArtifact.bytecode, sepoliaWallet);
    
    let evmContract;
    try {
        evmContract = await evmFactory.deploy();
        await evmContract.waitForDeployment();
    } catch(e) {
        console.error("EVM deployment failed:", e);
        return;
    }
    const evmAddress = await evmContract.getAddress();
    console.log(`✅ DirectIntMessageEvm deployed to: ${evmAddress}`);
    
    console.log("\n3. Linking EVM to COTI Pod...");
    try {
        const tx = await (evmContract as any).setCotiContract(podAddress);
        await tx.wait();
        console.log(`✅ Linkage successful! Set COTI contract on EVM to ${podAddress}.`);
    } catch(e) {
         console.error("Linkage failed:", e);
    }
    
    console.log("\nUpdating interact script with new EVM address...");
    const scriptPath = "scripts/interact_direct_int.ts";
    let scriptOutput = fs.readFileSync(scriptPath, "utf8");
    scriptOutput = scriptOutput.replace(/const contractAddress = "0x\.\.\.";/, `const contractAddress = "${evmAddress}";`);
    scriptOutput = scriptOutput.replace(/if \(contractAddress === "0x\.\.\."\) \{[\s\S]*?return;\n  \}/, "");
    fs.writeFileSync(scriptPath, scriptOutput);
    console.log("✅ Updated interact_direct_int.ts.");
    
    console.log("\nYou're ready to run: npx tsx -r dotenv/config scripts/interact_direct_int.ts");
}
main().catch(console.error);
