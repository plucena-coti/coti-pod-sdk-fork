import { ethers } from "ethers";
import * as fs from "fs";
import { Wallet } from "@coti-io/coti-ethers";
import { buildInputText } from "@coti-io/coti-sdk-typescript";

async function main() {
    const addrs = JSON.parse(fs.readFileSync("v2_int_deploy.json", "utf8"));
    const COTI_POD_ADDR = addrs.coti;
    const EVM_ADDR = addrs.evm;

    console.log(`Using EVM: ${EVM_ADDR}`);
    console.log(`Using COTI: ${COTI_POD_ADDR}`);

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    
    // Setting up the COTI AES Key (we need this to properly wrap the argument so the relayer can validate it bounds correctly)
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const cotiSigner = new Wallet(process.env.PRIVATE_KEY!, cotiProvider);
    await cotiSigner.generateOrRecoverAes();
    const accountAesKey = cotiSigner.getUserOnboardInfo()?.aesKey;

    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
    const dmEvm = new ethers.Contract(EVM_ADDR, evmArtifact.abi, deployer);

    const cotiArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessagePod.sol/DirectIntMessagePod.json", "utf8"));
    
    // Extract the precise method selector that the COTI relayer will invoke later
    const selector = new ethers.Interface(cotiArtifact.abi).getFunction("receiveMessage")!.selector;

    console.log(`\nEncrypting with buildInputText mapped to COTI Pod ${COTI_POD_ADDR} and selector ${selector}...`);
    const senderContext = {
        wallet: deployer as any,
        userKey: accountAesKey!,
    };
    
    // Create bounded Int payload using `buildInputText` 
    // IMPORTANT: It ties the signature explicitly to this target address + selector.
    const secretValue = BigInt(42069);
    const itUint64Args = await buildInputText(
        secretValue,
        senderContext,
        COTI_POD_ADDR,
        selector
    );

    // Provide gas buffers
    const callbackFeeWei = ethers.parseEther("0.015");
    const totalWei = ethers.parseEther("0.025"); 

    console.log(`\nDispatching newly encrypted bounded Int message (${secretValue}) to Sepolia Cross-chain bridge...`);
    const tx = await dmEvm.sendMessage(
        itUint64Args,
        deployer.address, 
        callbackFeeWei,
        { value: totalWei, gasLimit: 2500000 }
    );

    console.log("Transaction Hash:", tx.hash);
    const receipt = await tx.wait();

    let requestId = null;
    for (const log of receipt.logs) {
        try {
            const parsed = dmEvm.interface.parseLog(log as any);
            if (parsed && parsed.name === "MessageDispatched") {
                requestId = parsed.args.requestId;
                break;
            }
        } catch (e) {}
    }

    console.log("\n✅ Dispatch confirmed!");
    console.log(`Bridge RequestId: ${requestId}`);
    console.log(`The network will now attempt to route this payload exactly to ${COTI_POD_ADDR} via MPC!`);
}
main().catch(console.error);
