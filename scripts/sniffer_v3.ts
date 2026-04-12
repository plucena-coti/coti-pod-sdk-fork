import { ethers } from "ethers";

async function main() {
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const COTI_POD_ADDR = "0xDBA8DaF09bB0FE407856c1A36944314946eFe6cc";
    
    console.log("Checking logs on COTI...");
    const logs = await cotiProvider.getLogs({
        address: COTI_POD_ADDR,
        fromBlock: -1000
    });
    console.log(`Logs found: ${logs.length}`);
}
main();
