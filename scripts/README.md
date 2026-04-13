# COTI PoD PrivateAdder Scripts

This folder contains scripts to interact with the deployed `PrivateAdder` contract on the COTI Sepolia network.

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
