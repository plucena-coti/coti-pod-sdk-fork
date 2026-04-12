import hre from "hardhat";
import { ethers } from "ethers";
import * as fs from "fs";
import { Wallet } from "@coti-io/coti-ethers";
import { buildInputText } from "@coti-io/coti-sdk-typescript";

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    
    console.log("1. Deploying Sniffer to COTI...");
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const cotiWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);
    
    // Compile
    

    const artifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/Sniffer.sol/Sniffer.json", "utf8"));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, cotiWallet);
    const sniffer = await factory.deploy();
    await sniffer.waitForDeployment();
    const snifferAddr = await sniffer.getAddress();
    console.log(`✅ Sniffer deployed on COTI: ${snifferAddr}`);
    
    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
    const dmEvm = new ethers.Contract("0xE2fd06a3c85834178d033F67DeeD362485C0698b", evmArtifact.abi, wallet);

    console.log(`2. Linking EVM to Sniffer...`);
    const txLink = await dmEvm.setCotiContract(snifferAddr);
    await txLink.wait();

    console.log(`3. Sending payload from Sepolia...`);
    const cotiSigner = new Wallet(process.env.PRIVATE_KEY!, cotiProvider);
    await cotiSigner.generateOrRecoverAes();
    
    const senderContext = { wallet: cotiWallet as any, userKey: cotiSigner.getUserOnboardInfo()?.aesKey! };
    const selector = new ethers.Interface(artifact.abi).getFunction("receiveMessage")!.selector;
    const itUint64Args = await buildInputText(BigInt(0), senderContext, snifferAddr, selector);

    const txSend = await dmEvm.sendMessage(itUint64Args, wallet.address, ethers.parseEther("0.005"), { value: ethers.parseEther("0.005"), gasLimit: 2500000 });
    console.log(`TxHash: ${txSend.hash}`);
    await txSend.wait();

    console.log(`4. Waiting 30s for COTI to process...`);
    await new Promise(r => setTimeout(r, 30000));

    console.log(`5. Reading logs on COTI Sniffer...`);
    const logs = await cotiProvider.getLogs({ address: snifferAddr, fromBlock: 0, toBlock: 'latest' });
    console.log(`Logs found: ${logs.length}`);
    for(const l of logs) {
        const parsed = sniffer.interface.parseLog(l as any);
        console.log(`Result: caller=${parsed?.args.caller}`);
    }
}
main().catch(console.error);
