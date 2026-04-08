const hre = require("hardhat");

async function main() {
  if (!hre.ethers) {
    console.error("hre.ethers is undefined in CommonJS script! Did you import the plugin in hardhat.config.js?");
    process.exit(1);
  }
  const PrivateAdder = await hre.ethers.getContractFactory("PrivateAdder");
  console.log("Deploying PrivateAdder to Sepolia...");
  
  const privateAdder = await PrivateAdder.deploy();
  await privateAdder.waitForDeployment();

  console.log(`PrivateAdder deployed to: ${await privateAdder.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
