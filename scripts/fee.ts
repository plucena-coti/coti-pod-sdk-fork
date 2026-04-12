import "dotenv/config";
import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const INBOX_ADDRESS = "0xFa158f9e49C8bb77f971c3630EbCD23a8a88D14E"; // Sepolia inbox
    
    const inbox = new ethers.Contract(INBOX_ADDRESS, [
        "function calculateTwoWayFeeRequiredInLocalToken(uint256 a, uint256 b, uint256 c, uint256 d, uint256 e) view returns (uint256 targetGasRemote, uint256 callerGasLocal)"
    ], provider);

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? ethers.parseUnits("5", "gwei");

    // "Short message" has length ~13 bytes. But buildStringInputText splits it into 64 bytes chunks + signature.
    // Let's assume lengths:
    const remoteCallSize = 1000;
    const callbackSize = 300;
    const remoteGas = 3000000; // 3 million remote gas! Strings are expensive in MPC
    const callbackGas = 1000000;

    const [remoteWei, callbackWei] = await inbox.calculateTwoWayFeeRequiredInLocalToken(
        remoteCallSize, callbackSize, remoteGas, callbackGas, gasPrice
    );

    console.log(`remoteWei:   ${ethers.formatEther(remoteWei)} ETH`);
    console.log(`callbackWei: ${ethers.formatEther(callbackWei)} ETH`);
    console.log(`Total Need:  ${ethers.formatEther(remoteWei + callbackWei)} ETH`);
}

main().catch(console.error);
