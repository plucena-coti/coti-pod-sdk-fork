import { ethers } from "ethers";
import * as fs from "fs";
import { Wallet } from "@coti-io/coti-ethers";
import { buildInputText } from "@coti-io/coti-sdk-typescript";

async function main() {
    const addrs = JSON.parse(fs.readFileSync("v3_int_deploy.json", "utf8"));
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const cotiSigner = new Wallet(process.env.PRIVATE_KEY!, cotiProvider);
    await cotiSigner.generateOrRecoverAes();
    const accountAesKey = cotiSigner.getUserOnboardInfo()?.aesKey;

    const evmArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessageEvm.sol/DirectIntMessageEvm.json", "utf8"));
    const dmEvm = new ethers.Contract(addrs.evm, evmArtifact.abi, deployer);

    const cotiArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/examples/DirectIntMessagePod.sol/DirectIntMessagePod.json", "utf8"));
    const selector = new ethers.Interface(cotiArtifact.abi).getFunction("receiveMessage")!.selector;

    const itUint64Args = await buildInputText(
        BigInt(80085), { wallet: deployer as any, userKey: accountAesKey! }, addrs.coti, selector
    );

    const tx = await dmEvm.sendMessage(
        itUint64Args, deployer.address, ethers.parseEther("0.002"),
        { value: ethers.parseEther("0.005"), gasLimit: 2500000 }
    );
    console.log("Tx Hash:", tx.hash);
    const receipt = await tx.wait();

    let reqId = null;
    for (const log of receipt.logs) {
        try {
            const parsed = dmEvm.interface.parseLog(log as any);
            if (parsed && parsed.name === "MessageDispatched") {
                reqId = parsed.args.requestId; break;
            }
        } catch {}
    }
    console.log(`Bridge RequestId: ${reqId}`);

    for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 10000));
        let statusEnum = await dmEvm.statusByRequest(reqId);
        console.log(`Poll [${i+1}/6] -> Status: ${statusEnum}`);
        if (statusEnum === 2n) {
             console.log("🎉 Round-trip Complete!");
             break;
        }
    }
}
main().catch(console.error);
