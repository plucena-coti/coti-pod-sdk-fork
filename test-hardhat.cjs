const { task } = require("hardhat/config");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
console.log("Loaded in CJS");
module.exports = { solidity: "0.8.26" };
