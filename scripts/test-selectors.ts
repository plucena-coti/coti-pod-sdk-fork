import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
    const artEVM = await hre.artifacts.readArtifact("IDirectMessagePod");
    const artCOTI = await hre.artifacts.readArtifact("DirectMessagePod");
    const evmIfc = new ethers.Interface(artEVM.abi);
    const cotiIfc = new ethers.Interface(artCOTI.abi);
    
    console.log("EVM Selector (IDirectMessagePod.receiveMessage(itString,address)): ", evmIfc.getFunction("receiveMessage")?.selector);
    console.log("COTI Selector (DirectMessagePod.receiveMessage(gtString,address)): ", cotiIfc.getFunction("receiveMessage")?.selector);

    const inputsEVM = evmIfc.getFunction("receiveMessage")?.inputs;
    console.log("EVM Target Method Signature: ", evmIfc.getFunction("receiveMessage")?.format());

    const inputsCOTI = cotiIfc.getFunction("receiveMessage")?.inputs;
    console.log("COTI Expected Method Signature:", cotiIfc.getFunction("receiveMessage")?.format());
}
main();
