# COTI POD Cross-Chain: `itString` Execution Failure Report

## Executive Summary

During the development and testing of cross-chain messages over the COTI POD SDK (from Ethereum/Sepolia to the COTI Testnet), a critical limitation was discovered: **sending `itString` (dynamic length encrypted strings) across the bridge fails during execution on the COTI network.**

This report documents the investigation into the exact root cause, focusing on the `MpcAbiCodec.sol` library, the E2E relayer implementation (`contract-manager-service`), and the architectural mismatch between standard EVM dynamic arrays and COTI's MPC cryptographic precompiles.

---

## The Investigation

### 1. Identifying the Point of Failure
Transactions sending `itString` successfully emit the `MessageDispatched` event on Sepolia. However, the message either gets stuck or reverts upon execution on the COTI network. Initial suspects were the relayer gas limits, payload sizing, or an off-chain parsing bug.

### 2. Solidity's `MpcAbiCodec.sol` Behavior
To understand how payloads are packed for the bridge, we audited `MpcAbiCodec.sol`. We found two critical pieces of logic affecting `itString`:

**A. Flagging as Dynamic Type**
In `_normalizeArg`, when the parameter is typed as `IT_STRING`, the library explicitly returns `true` for its `dynamicType` flag:
```solidity
if (dataType == MpcDataType.IT_STRING) {
    itString memory itValue = abi.decode(argData, (itString));
    // ... validation omitted ...
    return (abi.encode(gtValue), true, 0); // `true` flags it as dynamic
}
```

**B. EVM Offset Pointer Injection**
Because standard EVM ABI requires dynamic elements (like `string` or dynamic arrays) to have their positions recorded via memory pointers, the `reEncodeWithGt` function injects a 32-byte positional offset whenever `isDynamic[i] == true`:
```solidity
if (isDynamic[i]) {
    uint offset = headSize + tailCursor;
    _writeWord(recoded, 4 + headCursor, offset); // <--- INJECTS 32-BYTE OFFSET POINTER
    // ... appends actual bytes to the tail variable ...
}
```

### 3. Reviewing the Relayer (`contract-manager-service`)
We cloned and inspected the proprietary COTI integration relayer codebase (`ext/contract-manager-service` -> `app/modules/pod-inbox-relay`). 
*   **Hypothesis:** The relayer was incorrectly unpacking or truncating the string.
*   **Finding:** The Python relayer (using FastAPI and Web3.py) acts as a **passive pipe**. It directly calls `getRequests` on the Sepolia `Inbox` and submits the raw, unmodified payload via `batchProcessRequests` to the COTI `InboxMiner`. 

This proved that the off-chain infrastructure does not mutate the payload—meaning the issue is strictly on-chain metadata vs. cryptography.

---

## Root Cause Analysis

The failure fundamentally lies in a conflict between **Standard EVM ABI Encoding** and **COTI MPC Signature Validation**.

1. **The Off-Chain Signature:** When you build the payload using the `@coti-io/coti-sdk-typescript` (e.g., `buildStringInputText`), a cryptographic signature is generated covering the exact sequence and ciphertext values of that specific string payload.
2. **The EVM Tampering:** To route this payload through the cross-chain Inbox system, `MpcAbiCodec.sol` wraps and repacks it. Because `itString` is naturally dynamic, the codec standardizes the ABI payload by injecting a positional pointer (e.g., `0x0000..0040`) directly into the byte stream.
3. **The On-Chain Rejection:** When the COTI `MpcCore` precompile attempts to decode and validate the payload on the target network, the byte layout has been altered (shifted by the standard EVM offset pointers). The cryptographic signature applied by the front-end SDK no longer matches the padded, pointer-injected byte stream reconstructed by `MpcAbiCodec`. 

As a result, the `MpcCore` precompile rejects the ciphertext as invalid/tampered, reverting the execution.

---

## Conclusions & Recommendations

1. **Relayer is Not Re-programmable for this Fix:** Since the relayer forwards raw payloads and the rejection happens natively in the MPC precompile validation on the COTI protocol level, we cannot solve this issue by simply patching the Python relayer or editing a TypeScript SDK.
2. **Avoid `itString` Over the Bridge:** Until COTI provides an updated `MpcAbiCodec` and equivalent precompile logic capable of correctly ignoring or recalculating dynamic offset pointers during signature verification, `itString` cannot be reliably sent cross-chain.
3. **Recommended Workarounds:**
   * Break dynamic strings into fixed-size cryptographic primitives that `MpcAbiCodec` treats as statically sized (`dynamicType = false`).
   * Use combinations of `bytes32` mappings, or pack states into `itUint256`/`itUint64` data blocks, which bypass the EVM `_writeWord` pointer injection block.