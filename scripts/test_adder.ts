import "dotenv/config";
import { ethers } from "ethers";
import { Wallet } from "@coti-io/coti-ethers";
import { buildInputText } from "@coti-io/coti-sdk-typescript";
import fs from "fs";

async function main() {
    const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    
    // Onboard requires COTI
    const cotiWallet = new Wallet(process.env.PRIVATE_KEY!, cotiProvider);
    await cotiWallet.generateOrRecoverAes();
    console.log("Onboarded AES Check:", !!cotiWallet.getUserOnboardInfo()?.aesKey);

    const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);

    const artifact = JSON.parse(fs.readFileSync("./artifacts/contracts/examples/PrivateAdder.sol/PrivateAdder.json", "utf-8"));
    const adderAddr = "0x2aA07A3A4FCDdb8D64febF61e7cfDEF79Fa0b6f9";
    const adder = new ethers.Contract(adderAddr, artifact.abi, sepoliaWallet);

    console.log("Executing standard Add...");
    const sender = { wallet: sepoliaWallet, userKey: cotiWallet.getUserOnboardInfo()!.aesKey! };
    
    // Use ethers.id directly
    const selector = ethers.id("add(uint64,uint256,bytes)").substring(0, 10);
    // Actually the COTI signature for PrivateAdder is `add(uint64,gtUint64)` which means the exact string might be `add(uint64,(uint256))`
    // But wait! buildInputText uses whatever we give it.
    // If we give it the wrong signature, MPC will fail the validateCiphertext check since it's tied to function signature selector!
    // The exact signature on PodAdder256 is `add(uint64,gtUint64)`. The ABI selector is keccak256("add(uint64,(uint256))") => 0x93309a6e
    const podAdderAbi = JSON.parse(fs.readFileSync("./artifacts/contracts/examples/it256/PodAdder256.sol/PodAdder256.json", "utf-8"));
    const podIface = new ethers.Interface(podAdderAbi.abi);
    const targetSelector = podIface.getFunction("add")!.selector;

    const ctUint64 = await buildInputText(12345n, sender, "0xdb2f8aee45dbb2a8ed2dffe9ff3d5c5642a8bbd3", targetSelector);

    const callbackFeeWei = ethers.parseEther("0.001");
    const totalWei = ethers.parseEther("0.005");

    console.log("Sending tx...");
    const tx = await adder.add(100n, ctUint64, callbackFeeWei, { value: totalWei, gasLimit: 2000000 });
    console.log("Tx Hash:", tx.hash);
    const receipt = await tx.wait();
    
    let requestId = null;
    for (const log of receipt.logs) {
        try {
            const parsed = adder.interface.parseLog(log as any);
            if (parsed && parsed.name === "AddRequested") { requestId = parsed.args.requestId; }
        } catch(e) {}
    }
    console.log("RequestId:", requestId);
    console.log("Tracking status...");
    
    // Wait for it to be relayed
    for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 10000));
        const status = Number(await adder.statusByRequest(requestId));
        console.log(`Poll ${i+1}: Status = ${["None(0)", "Pending(1)", "Completed(2)"][status] || status}`);
        if(status === 2n || status === 2) break;
    }
}
main().catch(console.error);
