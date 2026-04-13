# COTI PoD PrivateAdder Scripts

This folder contains scripts to interact with the deployed `PrivateAdder` contract on the COTI Sepolia network.

## Deployed Contract Addresses
* **EVM Network (Sepolia):** `0x2aA07A3A4FCDdb8D64febF61e7cfDEF79Fa0b6f9` ([PrivateAdder.sol](../examples/PrivateAdder.sol))
* **COTI Network (Testnet):** `0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c` ([MpcAdder.sol](../examples/MpcAdder.sol))

## 1. Submitting a Transaction

The `interact.ts` script handles the full flow of encrypting inputs, estimating fees, submitting the transaction, and executing the asynchronous PoD operation. 
It will automatically poll the network waiting for the off-chain MPC nodes to complete the calculation and trigger the callback.

```bash
npx hardhat run scripts/interact.ts --network sepolia
```

## 2. Calculating Fees dynamically

If your transaction remains stuck in the `Pending (1)` state for a long time, it might be due to undershooting the required callback fees. You can use the `fee.ts` script to query the COTI Sepolia `Inbox` oracle for precise, real-time fee estimates based on current network gas prices.

```bash
npx hardhat run scripts/fee.ts --network sepolia
```

You can then update the `callbackFeeWei` and `totalWei` parameters in `interact.ts` with the safe, buffered output provided by this script.

## 3. Reading Transaction Results

If you stop the `interact.ts` script while it is polling, or if you simply want to check the status of an older transaction, you can use the `read-result.ts` script to query its off-chain progression natively.

Pass the transaction hash via the `TX_HASH` environment variable:

```bash
TX_HASH=0xYourTransactionHash npx hardhat run scripts/read-result.ts --network sepolia
```

**Example:**
```bash
TX_HASH=0x0c22499a296419c5c28f5b7e1e5fca44d0f72c4ecf9b887052d7d2d1d93100a9 npx hardhat run scripts/read-result.ts --network sepolia
```

This will:
1. Fetch the transaction receipt.
2. Extract the internal COTI `RequestId` from the `AddRequested` logs.
3. Check the on-chain status mapping (`Pending` or `Completed`).
4. Display the resulting encrypted output (which can then be decrypted with the user's `accountAesKey`).





# COTI PoD StringMatcher Scripts

This folder contains scripts to interact with the deployed `StringMatcher` contracts on the COTI Sepolia network.

## Deployed Contract Addresses
* **EVM Network (Sepolia):** `0xd7656ACACE5Ab0081f453047DA514283928db544` ([StringMatcherEvm.sol](./StringMatcherEvm.sol))
* **COTI Network (Testnet):** `0x68DC00290280Abbd367275FBAf69898549F3A02f` ([StringMatcherPod.sol](./StringMatcherPod.sol))

## 1. Submitting a Transaction

The `interact_matcher.ts` script handles the full flow of encrypting inputs (like a String guess), estimating fees, submitting the transaction, and executing the asynchronous PoD operation. 
It will automatically poll the network waiting for the off-chain MPC nodes to complete the calculation and trigger the callback.

```bash
npx hardhat run scripts/interact_matcher.ts --network sepolia
```

## 2. Calculating Fees dynamically

If your transaction remains stuck in the `Pending (1)` state for a long time, it might be due to undershooting the required callback fees. You can use the `fee.ts` script to query the COTI Sepolia `Inbox` oracle for precise, real-time fee estimates based on current network gas prices.

```bash
npx hardhat run scripts/fee.ts --network sepolia
```

You can then update the `callbackFeeWei` and `totalWei` parameters in `interact_matcher.ts` with the safe, buffered output provided by this script.

## 3. Reading Transaction Results

If you stop the `interact_matcher.ts` script while it is polling, or if you simply want to check the status of an older transaction, you can use the `poll_matcher.ts` script to query its off-chain progression natively.

Pass the transaction hash via the `TX_HASH` environment variable:

```bash
TX_HASH=0xYourTransactionHash npx hardhat run scripts/poll_matcher.ts --network sepolia
```

**Example:**
```bash
TX_HASH=0x0c22499a296419c5c28f5b7e1e5fca44d0f72c4ecf9b887052d7d2d1d93100a9 npx hardhat run scripts/poll_matcher.ts --network sepolia
```

This will:
1. Fetch the transaction receipt.
2. Check the on-chain status mapping (`Pending` or `Completed`).
3. Display the resulting encrypted boolean output (which can then be decrypted with the user's `accountAesKey`).



# COTI PoD DirectIntMessage Scripts

This folder contains scripts to interact with the deployed `DirectIntMessage` contracts on the COTI Sepolia network.

## Deployed Contract Addresses
* **EVM Network (Sepolia):** `0x57cfE5220Ce6219c5Fa6ffE72D8c1De26454e64d` ([DirectIntMessageEvm.sol](./DirectIntMessageEvm.sol))
* **COTI Network (Testnet):** `0xD65e349AE5A460419C44a6334D803D5316464bCA` ([DirectIntMessagePod.sol](./DirectIntMessagePod.sol))

## 1. Submitting a Transaction

The `interact_direct_int.ts` script handles the full flow of encrypting inputs (an integer), estimating fees, submitting the transaction, and executing the asynchronous PoD operation. 
It will automatically poll the network waiting for the off-chain MPC nodes to complete the calculation and trigger the callback.

```bash
export DIRECT_INT_EVM=0x57cfE5220Ce6219c5Fa6ffE72D8c1De26454e64d
npx hardhat run scripts/interact_direct_int.ts --network sepolia
```

## 2. Calculating Fees dynamically

If your transaction remains stuck in the `Pending (1)` state for a long time, it might be due to undershooting the required callback fees. You can use the `fee.ts` script to query the COTI Sepolia `Inbox` oracle for precise, real-time fee estimates based on current network gas prices.

```bash
npx hardhat run scripts/fee.ts --network sepolia
```

## 3. Reading Transaction Results

If you stop the `interact_direct_int.ts` script while it is polling, or if you simply want to check the status of an older transaction, you can use the `poll_direct_int.ts` script to query its off-chain progression natively.

Pass the transaction hash via the `TX_HASH` environment variable:

```bash
export DIRECT_INT_EVM=0x57cfE5220Ce6219c5Fa6ffE72D8c1De26454e64d
export TX_HASH=0xYourTransactionHash
npx hardhat run scripts/poll_direct_int.ts --network sepolia
```
