# Getting started

## Prerequisites

- Node.js 18+ (for modern runtime compatibility including `fetch`).
- Solidity toolchain (Foundry or Hardhat).
- An Inbox deployment on your EVM chain and connectivity to COTI execution.

## Install

```bash
npm install @coti/pod-sdk
```

## Imports

```solidity
import "@coti/pod-sdk/contracts/IInbox.sol";
import "@coti/pod-sdk/contracts/mpc/MpcLib.sol";
import "@coti/pod-sdk/contracts/mpccodec/MpcAbiCodec.sol";
import "@coti/pod-sdk/contracts/utils/mpc/MpcCore.sol";
```

```typescript
import { CotiPodCrypto, DataType } from "@coti/pod-sdk";
```

## Minimal contract with safe configuration pattern

`MpcUser.configureCoti(...)` is `public` in the SDK base contract. In production, gate who can call it.

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@coti/pod-sdk/contracts/mpc/MpcLib.sol";
import "@coti/pod-sdk/contracts/utils/mpc/MpcCore.sol";

contract PrivateCompare is MpcLib {
    address public owner;

    mapping(bytes32 => ctBool) public resultByRequest;

    event CompareRequested(bytes32 indexed requestId, address indexed caller);
    event CompareCompleted(bytes32 indexed requestId, ctBool result);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor(address inboxAddress, address executor, uint256 cotiChain) {
        owner = msg.sender;
        setInbox(inboxAddress);
        configureCoti(executor, cotiChain);
    }

    // Gate reconfiguration in production.
    function setCotiRoute(address executor, uint256 cotiChain) external onlyOwner {
        configureCoti(executor, cotiChain);
    }

    function compare(itUint64 calldata a, itUint64 calldata b) external {
        bytes32 requestId = gt(
            a,
            b,
            msg.sender,
            this.compareCallback.selector,
            this.onDefaultMpcError.selector
        );

        emit CompareRequested(requestId, msg.sender);
    }

    function compareCallback(bytes memory data) external onlyInbox {
        bytes32 requestId = inbox.inboxSourceRequestId();
        if (requestId == bytes32(0)) {
            requestId = inbox.inboxRequestId();
        }

        ctBool result = abi.decode(data, (ctBool));
        resultByRequest[requestId] = result;
        emit CompareCompleted(requestId, result);
    }
}
```

## Minimal frontend flow

```typescript
import { CotiPodCrypto, DataType } from "@coti/pod-sdk";

const encA = await CotiPodCrypto.encrypt("10", "testnet", DataType.Uint64);
const encB = await CotiPodCrypto.encrypt("20", "testnet", DataType.Uint64);

// await contract.compare(encA, encB)
// later read ctBool and decrypt with user's AES key:
const plain = CotiPodCrypto.decrypt("0x...", accountAesKey, DataType.Bool);
```

## First production checklist

- Gate all admin config functions (`configureCoti` wrappers, upgrade hooks, etc.).
- Ensure every callback and error handler is `onlyInbox`.
- Persist request IDs for correlation and troubleshooting.
- Keep callback decode tuple exactly aligned to COTI response tuple.
- Keep account AES key out of logs and analytics.
