# Bugfix Requirements Document

## Introduction

`DirectMessageEvm.sol` fails to communicate correctly across chains with `DirectMessagePod.sol`. Comparing against the working `PErc20.sol` ↔ `PErc20Coti.sol` pair reveals that `DirectMessageEvm` uses the wrong inheritance hierarchy (`PodLibBase` instead of `PodLib`) and has redundant constructor initialization from combining `PodLibBase` with `PodUserSepolia`. The COTI-side `DirectMessagePod.sol` follows the correct pattern and does not require changes.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `DirectMessageEvm` inherits `PodLibBase, PodUserSepolia` instead of `PodLib, PodUserSepolia` THEN the contract deviates from the documented and working inheritance pattern, which may cause cross-chain communication failures due to incorrect C3 linearization or missing functionality provided by the full `PodLib` chain (`PodLib64`, `PodLib128`, `PodLib256`)

1.2 WHEN `DirectMessageEvm`'s constructor body calls `setInbox(INBOX_ADDRESS)` and `configureCoti(MPC_EXECUTOR_ADDRESS, COTI_CHAIN_ID)` THEN the inbox and COTI routing are set redundantly because `PodUserSepolia`'s constructor already performs the same calls, creating a double-initialization code smell that diverges from the documented constructor pattern

### Expected Behavior (Correct)

2.1 WHEN `DirectMessageEvm` is declared THEN the contract SHALL inherit `PodLib, PodUserSepolia` to match the documented pattern (`contract MyApp is PodLib, PodUserSepolia`) and the working `PErc20` reference which inherits `PodLib`

2.2 WHEN `DirectMessageEvm`'s constructor executes THEN the constructor body SHALL NOT redundantly call `setInbox()` and `configureCoti()` since `PodUserSepolia`'s constructor already performs these calls, matching the clean initialization pattern shown in the documentation

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `sendMessage` is called with a valid `itString`, recipient address, and sufficient `msg.value` THEN the system SHALL CONTINUE TO construct the `MpcMethodCall` via `MpcAbiCodec` with `IDirectMessagePod.receiveMessage.selector` and dispatch it via `_sendTwoWayWithFee`

3.2 WHEN the COTI-side `DirectMessagePod.receiveMessage` executes successfully and calls `inbox.respond(abi.encode(requestId, "Message received seamlessly"))` THEN the `onMessageReceived` callback SHALL CONTINUE TO decode the response as `(bytes32, string)` and emit the `MessageReply` event

3.3 WHEN `DirectMessagePod.receiveMessage` is called by the Inbox relayer THEN the contract SHALL CONTINUE TO call `MpcCore.offBoardToUser(message, recipient)`, store the ciphertext, emit `CiphertextSaved`, and respond via `inbox.respond`

3.4 WHEN `setCotiContract` is called by the owner THEN the system SHALL CONTINUE TO update the MPC executor address via `configureCoti`

3.5 WHEN an MPC error occurs THEN the system SHALL CONTINUE TO use `this.onDefaultMpcError.selector` as the error callback to surface error details via `ErrorRemoteCall` event
