import fs from "fs";
import { ethers } from "ethers";
const artifact = JSON.parse(fs.readFileSync("./artifacts/contracts/examples/PrivateAdder.sol/PrivateAdder.json", "utf-8"));
const iface = new ethers.Interface(artifact.abi);
console.log(iface.getFunction("add")!.inputs.map(i => `${i.name}: ${i.type}, ${i.components?.map(c => `${c.name}:${c.type}`).join("|")}`));
