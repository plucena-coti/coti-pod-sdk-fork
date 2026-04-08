import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    
    // Sepolia Inbox Contract Address setup by PodUserSepolia 
    const INBOX_ADDRESS = "0xFa158f9e49C8bb77f971c3630EbCD23a8a88D14E";
    
    const inbox = new ethers.Contract(INBOX_ADDRESS, [
        "function calculateTwoWayFeeRequiredInLocalToken(uint256 a, uint256 b, uint256 c, uint256 d, uint256 e) view returns (uint256 targetGasRemote, uint256 callerGasLocal)"
    ], provider);

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? ethers.parseUnits("5", "gwei");
    console.log(`Current Sepolia Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} gwei\n`);

    // Reasonable conservative estimates for PrivateAdder
    const remoteCallSize = 500;  // size of outbound payload
    const callbackSize = 150;    // size of inbound payload
    const remoteGas = 300000;    // gas to run addition off-chain 
    const callbackGas = 300000;  // gas to run 'addCallback' on Sepolia

    console.log("Asking the Inbox Oracle to calculate precise fees...");
    const [remoteWei, callbackWei] = await inbox.calculateTwoWayFeeRequiredInLocalToken(
        remoteCallSize,
        callbackSize,
        remoteGas,
        callbackGas,
        gasPrice
    );

    // 2. Add Buffer (e.g. 20-50% buffer against gas fluctuation)
    console.log("=== Fees according to COTI Sepolia Inbox (Buffered +50%) ===");
    
    const safeCallbackFeeWei = (callbackWei * 150n) / 100n;
    console.log(`callbackFeeLocalWei (Input 3): ${ethers.formatEther(safeCallbackFeeWei)} ETH`);

    const safeRemoteFeeWei = (remoteWei * 150n) / 100n;
    const totalMsgValue = safeCallbackFeeWei + safeRemoteFeeWei;
    
    console.log(`msg.value (Input 4):           ${ethers.formatEther(totalMsgValue)} ETH`);
    
    console.log("\nUpdate your `interact.ts` script to use these new bounds instead of the hardcoded 0.001 / 0.01! \n(e.g., totalWei = ethers.parseEther('...'), callbackFeeWei = ethers.parseEther('...'))");
}

main().catch(console.error);
