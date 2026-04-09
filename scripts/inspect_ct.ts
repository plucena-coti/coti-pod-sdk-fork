import { ethers } from "ethers";
import hre from "hardhat";
async function main() {
  const url = "https://testnet.coti.io/rpc";
  const provider = new ethers.JsonRpcProvider(url);
  const contractAddress = "0x133608213cD92e93b589894C404841d638F692D8";
  const artifact = await hre.artifacts.readArtifact("DirectMessage");
  const contract = new ethers.Contract(contractAddress, artifact.abi, provider);
  const ctMessage = await contract.read_message(0n);
  console.log("ctMessage:", ctMessage);
  console.log("ctMessage[0]:", ctMessage[0]);
}
main();
