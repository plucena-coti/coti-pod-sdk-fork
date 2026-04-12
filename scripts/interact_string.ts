import { ethers } from "ethers";
import * as fs from "fs";
import { Wallet } from "@coti-io/coti-ethers";
import { buildStringInputText } from "@coti-io/coti-sdk-typescript";

async function main() {
    const deployment = JSON.parse(fs.readFileSync("string_deploy.json", "utf8"));
    const COTI_POD_ADDR = deployment.podAddress;
    const EVM_ADDR = deployment.evmAddress;
    
    // Quick switch between right guess and wrong guess
    const IS_RIGHT_GUESS = true; 
    const guessString = IS_RIGHT_GUESS ? "hello_coti_123" : "wrong_password";

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const cotiSigner = new Wallet(process.env.PRIVATE_KEY!, cotiProvider);
    
    await cotiSigner.generateOrRecoverAes();
    const accountAesKey = cotiSigner.getUserOnboardInfo()?.aesKey;

    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/StringMatcherEvm.sol/StringMatcherEvm.json", "utf8"));
    const dmEvm = new ethers.Contract(EVM_ADDR, evmArtifact.abi, deployer);

    const cotiArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/StringMatcherPod.sol/StringMatcherPod.json", "utf8"));
    const selector = new ethers.Interface(cotiArtifact.abi).getFunction("matchSecret")!.selector;

    console.log(`\nEncrypting our guess ('${guessString}') mapping to ${COTI_POD_ADDR} with selector ${selector}...`);
    const senderContext = {
        wallet: deployer as any,
        userKey: accountAesKey!,
    };
    
    // Encrypt exactly as an itString for the specific contract & function!
    const itStringArgs = await buildStringInputText(
        guessString,
        senderContext,
        COTI_POD_ADDR,
        selector
    );

    const callbackFeeWei = ethers.parseEther("0.001");
    // Extra buffer to make sure it routes properly!
    const totalWei = ethers.parseEther("0.008"); 

    console.log(`\nDispatching the encrypted string to ${deployer.address}...`);
    const tx = await dmEvm.matchGuess(
        itStringArgs,
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
            if (parsed && parsed.name === "MatchRequested") {
                requestId = parsed.args.requestId;
                break;
            }
        } catch (e) {}
    }

    console.log("\n✅ Dispatch confirmed!");
    console.log(`Bridge RequestId: ${requestId}`);
    console.log(`Run 'npx tsx scripts/poll_string.ts' to watch for the results...`);
}
main().catch(console.error);
