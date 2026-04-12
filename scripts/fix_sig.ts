import { ethers } from "ethers";
const iface = new ethers.Interface([
    "function add64(uint256 a, uint256 b, address cOwner) external"
]);
console.log("Selector for add64:", iface.getFunction("add64")!.selector);
