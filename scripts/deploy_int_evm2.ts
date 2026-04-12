import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    console.log("Compiling and Deploying New DirectIntMessageEvm...");
    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
    const evmFactory = new ethers.ContractFactory(evmArtifact.abi, evmArtifact.bytecode, wallet);

    const evmContract = await evmFactory.deploy();
    await evmContract.waitForDeployment();
    const evmAddr = await evmContract.getAddress();

    console.log(`✅ Deployed NEW DirectIntMessageEvm to: ${evmAddr}`);
    
    // We update Linkage to the existing Pod contract right now!
    const COTI_POD_ADDR = "0xb3a8d2DF02b439fb9c309143feDadA14BB2F618E";
    console.log(`Setting COTI Pod to: ${COTI_POD_ADDR}`);
    const tx = await (evmContract as any).setCotiContract(COTI_POD_ADDR);
    await tx.wait();
    console.log("✅ Linkage updated.");
}
main().catch(console.error);
