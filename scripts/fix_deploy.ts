import { ethers } from "ethers";
import * as fs from "fs";

async function main() {
    const provider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    console.log("Deploying StringMatcherPod to COTI Testnet with actual inbox...");
    const podArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/StringMatcherPod.sol/StringMatcherPod.json", "utf8"));
    const podFactory = new ethers.ContractFactory(podArtifact.abi, podArtifact.bytecode, wallet);
    
    // THE REAL INBOX ON COTI TESTNET
    const COTI_INBOX = "0x0f9a5cd00450db1217839c35d23d56f96d6331ae"; 
    const podContract = await podFactory.deploy(COTI_INBOX, { gasLimit: 5000000 });
    await podContract.waitForDeployment();
    const podAddress = await podContract.getAddress();
    console.log(`✅ Fixed StringMatcherPod deployed to: ${podAddress}`);

    // Update StringMatcherEvm with the new Target
    console.log("Updating SEPOLIA StringMatcherEvm to target the new POD...");
    const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);
    const StringMatcherEvmAddr = "0xd7656ACACE5Ab0081f453047DA514283928db544";
    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/StringMatcherEvm.sol/StringMatcherEvm.json", "utf8"));
    const evmContract = new ethers.Contract(StringMatcherEvmAddr, evmArtifact.abi, sepoliaWallet);
    const tx = await evmContract.setCotiContract(podAddress);
    await tx.wait();
    console.log("✅ Sepolia EVM updated!");
}
main().catch(console.error);
