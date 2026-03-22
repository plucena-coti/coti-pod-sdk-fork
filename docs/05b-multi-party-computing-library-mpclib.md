# Multi-party Computing library (MpCLib)

Source: `/contracts/mpc/PodMpcLib.sol`

`PodMpcLib` is the EVM-side helper for built-in COTI private methods.

## What it does

- Builds method payloads with `MpcAbiCodec`.
- Routes messages to configured COTI executor (`mpcExecutorAddress`, `cotiChainId`).
- Sends two-way Inbox request with callback and error selectors.
- Provides default error handler `onDefaultMpcError(bytes32 requestId)`.

Important mapping behavior:

- EVM calls `PodMpcLib` methods with `it*` input arguments.
- COTI-side common methods are defined with `gt*` parameters (`ICommonMpcMethods`).
- request re-encoding/validation converts `it*` payloads into `gt*` ABI arguments before COTI invocation.

## Available built-in methods

- `add(itUint64 a, itUint64 b, address cOwner, bytes4 callbackSelector, bytes4 errorSelector)`
- `gt(itUint64 a, itUint64 b, address cOwner, bytes4 callbackSelector, bytes4 errorSelector)`

Both return `bytes32 requestId`.

## Important configuration behavior

Inherited from `/contracts/mpc/MpcUser.sol`:

- default `mpcExecutorAddress`: `0x0000000000000000000000000000000000000000`
- default `cotiChainId`: `2632500`
- `configureCoti(address,uint256)` is `public virtual`

Production implication:

- do not expose unrestricted reconfiguration,
- gate config updates with access control.

## Integration example

```solidity
contract MyContract is PodMpcLib {
    address public owner;

    modifier onlyOwner() { require(msg.sender == owner, "only owner"); _; }

    constructor(address inboxAddress, address executor, uint256 cotiChain) {
        owner = msg.sender;
        setInbox(inboxAddress);
        configureCoti(executor, cotiChain);
    }

    function setCotiRoute(address executor, uint256 cotiChain) external onlyOwner {
        configureCoti(executor, cotiChain);
    }

    function privateAdd(itUint64 calldata a, itUint64 calldata b) external {
        bytes32 requestId = add(
            a,
            b,
            msg.sender,
            this.privateAddCallback.selector,
            this.onDefaultMpcError.selector
        );
        emit PrivateAddRequested(requestId);
    }

    function privateAddCallback(bytes memory data) external onlyInbox {
        ctUint64 out = abi.decode(data, (ctUint64));
        // store result
    }
}
```

## When to move beyond `PodMpcLib`

Use custom EVM + COTI contracts when:

- operation is not one of built-ins,
- callback payload is a custom tuple,
- COTI logic requires multiple private compute steps and state.
