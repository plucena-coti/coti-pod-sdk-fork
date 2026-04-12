import { ethers } from "ethers";
import * as fs from "fs";
import { Wallet } from "@coti-io/coti-ethers";
import { buildInputText } from "@coti-io/coti-sdk-typescript";

async function main() {
    const COTI_POD_ADDR = "0xb3a8d2DF02b439fb9c309143feDadA14BB2F618E";
    const EVM_ADDR = "0xE2fd06a3c85834178d033F67DeeD362485C0698b";
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    
    const cotiSigner = new Wallet(process.env.PRIVATE_KEY!, cotiProvider);
    await cotiSigner.generateOrRecoverAes();
    const accountAesKey = cotiSigner.getUserOnboardInfo()?.aesKey;

    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
    const dmEvm = new ethers.Contract(EVM_ADDR, evmArtifact.abi, deployer);

    const cotiArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessagePod.sol/DirectIntMessagePod.json", "utf8"));
    const selector = new ethers.Interface(cotiArtifact.abi).getFunction("receiveMessage")!.selector;

    console.log(`\nEncrypting with buildInputText mapped to ${COTI_POD_ADDR} and selector ${selector}...`);
    const senderContext = {
        wallet: deployer as any,
        userKey: accountAesKey!,
    };
    
    // Create bounded Int payload (1337)
    const itUint64Args = await buildInputText(
        BigInt(1337),
        senderContext,
        COTI_POD_ADDR,
        selector
    );

    const callbackFeeWei = ethers.parseEther("0.001");
    // Ensure gas buffers
    const totalWei = ethers.parseEther("0.004"); 

    console.log(`\nDispatching bounded Int message to ${deployer.address}...`);
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
    console.log(`Update read-result.ts with this Request ID to check state mapping soon!`);
}
main().catch(console.error);
