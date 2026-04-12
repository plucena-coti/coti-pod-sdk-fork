import "dotenv/config";
import { ethers } from "ethers";
import { Wallet } from "@coti-io/coti-ethers";
import { buildInputText } from "@coti-io/coti-sdk-typescript";
import fs from "fs";

async function main() {
    const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const cotiWallet = new Wallet(process.env.PRIVATE_KEY!, cotiProvider);
    await cotiWallet.generateOrRecoverAes();
    const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);

    const artifact = JSON.parse(fs.readFileSync("./artifacts/contracts/examples/PrivateAdder.sol/PrivateAdder.json", "utf-8"));
    const adderAddr = "0x2aA07A3A4FCDdb8D64febF61e7cfDEF79Fa0b6f9";
    const adder = new ethers.Contract(adderAddr, artifact.abi, sepoliaWallet);

    const sender = { wallet: sepoliaWallet as any, userKey: cotiWallet.getUserOnboardInfo()!.aesKey! };
    
    // The target executed on COTI network is MPC_EXECUTOR running IPodExecutor64.add64
    const MPC_EXECUTOR_ADDRESS = "0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c";
    const targetSelector = "0x210d1ab3"; // add64(uint256,uint256,address)

    const bVal = 555n;
    const aVal = 999n;
    
    console.log(`Building input text for aVal=${aVal}...`);
    const ctUint64A = await buildInputText(aVal, sender, MPC_EXECUTOR_ADDRESS, targetSelector) as any;

    console.log(`Building input text for bVal=${bVal}...`);
    const ctUint64B = await buildInputText(bVal, sender, MPC_EXECUTOR_ADDRESS, targetSelector) as any;

    const callbackFeeWei = ethers.parseEther("0.025");
    const totalWei = ethers.parseEther("0.06");

    const ctObjA = {
      ciphertext: BigInt(ctUint64A.ciphertext.toString()),
      signature:  ctUint64A.signature
    };
    
    const ctObjB = {
      ciphertext: BigInt(ctUint64B.ciphertext.toString()),
      signature:  ctUint64B.signature
    };

    console.log("Sending tx...");
    const tx = await adder.add(ctObjA, ctObjB, callbackFeeWei, { value: totalWei, gasLimit: 2000000 });
    console.log("Tx Hash:", tx.hash);
    
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    
    let requestId = null;
    for (const log of receipt.logs) {
        try {
            const parsed = adder.interface.parseLog(log as any);
            if (parsed && parsed.name === "AddRequested") { requestId = parsed.args.requestId; }
        } catch(e) {}
    }
    console.log("RequestId:", requestId);
}
main().catch(console.error);
