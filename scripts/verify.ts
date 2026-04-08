import hre from "hardhat";
import "@nomicfoundation/hardhat-verify";

async function main() {
  console.log("Tasks available:", Object.keys(hre.tasks).join(", "));
  await hre.run("verify:verify", {
    address: "0x2aA07A3A4FCDdb8D64febF61e7cfDEF79Fa0b6f9",
  });
}

main().catch(console.error);
