# Fix DirectMessageEvm Cross-Chain Communication — Bugfix Design

## Overview

`DirectMessageEvm.sol` uses the wrong inheritance hierarchy (`PodLibBase, PodUserSepolia` instead of `PodLib, PodUserSepolia`) and redundantly initializes inbox/COTI routing in its constructor body despite `PodUserSepolia` already performing that setup. The fix corrects the inheritance to match the documented pattern and removes the duplicate constructor calls, aligning `DirectMessageEvm` with the working `PErc20` reference and SDK documentation.

## Glossary

- **Bug_Condition (C)**: The contract declaration of `DirectMessageEvm` — specifically the inheritance list and constructor body that deviate from the documented `PodLib, PodUserSepolia` pattern
- **Property (P)**: After the fix, `DirectMessageEvm` SHALL inherit `PodLib, PodUserSepolia` and its constructor SHALL NOT contain redundant `setInbox`/`configureCoti` calls
- **Preservation**: All existing runtime behavior — `sendMessage` dispatch, `onMessageReceived` callback, `setCotiContract` owner function, error handling, and `DirectMessagePod` interaction — must remain unchanged
- **PodLib**: The combined 64/128/256-bit POD MPC helper in `contracts/mpc/PodLib.sol`; inherits `PodLib64, PodLib128, PodLib256` which all inherit `PodLibBase`
- **PodLibBase**: The shared POD base in `contracts/mpc/PodLibBase.sol`; provides `_sendTwoWayWithFee`, `_forwardTwoWay`, and `onDefaultMpcError`
- **PodUserSepolia**: The Sepolia preset mixin in `contracts/mpc/PodUserSepolia.sol`; its constructor calls `setInbox(INBOX_ADDRESS)` and `configureCoti(MPC_EXECUTOR_ADDRESS, COTI_CHAIN_ID)`

## Bug Details

### Bug Condition

The bug manifests in the contract declaration and constructor of `DirectMessageEvm.sol`. The contract inherits `PodLibBase, PodUserSepolia` instead of the documented `PodLib, PodUserSepolia`, and its constructor body redundantly calls `setInbox()` and `configureCoti()` even though `PodUserSepolia`'s constructor already performs these calls.

**Formal Specification:**
```
FUNCTION isBugCondition(contractSource)
  INPUT: contractSource of type SolidityContractDeclaration
  OUTPUT: boolean

  hasWrongInheritance := contractSource.inheritanceList CONTAINS "PodLibBase"
                         AND contractSource.inheritanceList NOT CONTAINS "PodLib"

  hasRedundantInit := contractSource.constructorBody CONTAINS call("setInbox")
                      AND contractSource.constructorBody CONTAINS call("configureCoti")
                      AND contractSource.inheritanceList CONTAINS "PodUserSepolia"

  RETURN hasWrongInheritance OR hasRedundantInit
END FUNCTION
```

### Examples

- **Wrong inheritance**: `contract DirectMessageEvm is PodLibBase, PodUserSepolia` — inherits `PodLibBase` directly instead of `PodLib`, deviating from the documented pattern `contract MyApp is PodLib, PodUserSepolia` and the working `PErc20` reference which inherits `PodLib`
- **Redundant constructor calls**: The constructor body calls `setInbox(INBOX_ADDRESS)` and `configureCoti(MPC_EXECUTOR_ADDRESS, COTI_CHAIN_ID)`, but `PodUserSepolia`'s constructor already executes both of these, resulting in double initialization
- **Correct reference — PErc20**: `contract PErc20 is PodLib` inherits `PodLib` (not `PodLibBase`), following the documented pattern
- **Correct reference — PrivateCompare (docs)**: `contract PrivateCompare is PodLib, PodUserSepolia` has no constructor body — it relies entirely on `PodUserSepolia`'s constructor for inbox/COTI setup

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `sendMessage` must continue to construct `MpcMethodCall` via `MpcAbiCodec` with `IDirectMessagePod.receiveMessage.selector` and dispatch via `_sendTwoWayWithFee`
- `onMessageReceived` callback must continue to decode `(bytes32, string)` response and emit `MessageReply`
- `DirectMessagePod.receiveMessage` must continue to call `MpcCore.offBoardToUser`, store ciphertext, emit `CiphertextSaved`, and respond via `inbox.respond`
- `setCotiContract` must continue to update the MPC executor address via `configureCoti`
- Error handling must continue to use `this.onDefaultMpcError.selector` and surface errors via `ErrorRemoteCall` event
- The `IDirectMessagePod` interface and its selector resolution must remain unchanged

**Scope:**
All runtime behavior of `DirectMessageEvm` is unaffected by this fix. The changes are purely structural (inheritance list and constructor body). No function signatures, event definitions, state variables, or business logic change.

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Copy-paste from a pre-PodLib template**: `DirectMessageEvm` was likely written before `PodLib` was finalized or was copied from a template that used `PodLibBase` directly. The `PodLib` aggregator (`PodLib64, PodLib128, PodLib256`) was introduced to provide the full MPC helper surface, but `DirectMessageEvm` was never updated.

2. **Misunderstanding of PodUserSepolia's constructor**: The developer may not have realized that `PodUserSepolia`'s constructor already calls `setInbox` and `configureCoti`, leading to redundant manual calls in `DirectMessageEvm`'s constructor body. The early documentation snippet in `04-getting-started.md` also shows these manual calls alongside `PodUserSepolia`, which may have reinforced the pattern.

3. **No immediate compilation error**: Since `PodLibBase` is a valid abstract contract and the redundant calls don't cause a revert (they just overwrite the same values), the bug doesn't surface as a compile-time or obvious runtime error — it manifests as a deviation from the canonical pattern and potential C3 linearization issues.

## Correctness Properties

Property 1: Bug Condition — Correct Inheritance and Constructor

_For any_ Solidity source of `DirectMessageEvm.sol` where the bug condition holds (inherits `PodLibBase` instead of `PodLib`, or constructor body contains redundant `setInbox`/`configureCoti` calls alongside `PodUserSepolia`), the fixed source SHALL inherit `PodLib, PodUserSepolia` and the constructor body SHALL contain only the `PodLibBase(msg.sender)` initializer with no redundant setup calls.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Runtime Behavior Unchanged

_For any_ call to `sendMessage`, `onMessageReceived`, `setCotiContract`, or `onDefaultMpcError` on the fixed contract, the fixed contract SHALL produce the same observable behavior (events emitted, state changes, return values, reverts) as the original contract, preserving all cross-chain messaging, callback handling, and error surfacing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `contracts/examples/DirectMessageEvm.sol`

**Specific Changes**:

1. **Fix import statement**: Replace `import {PodLibBase} from "../mpc/PodLibBase.sol"` with `import {PodLib} from "../mpc/PodLib.sol"`. The `PodLibBase` import is no longer needed directly since `PodLib` inherits it.

2. **Fix inheritance list**: Change `contract DirectMessageEvm is PodLibBase, PodUserSepolia` to `contract DirectMessageEvm is PodLib, PodUserSepolia`. This matches the documented pattern and the working `PErc20` reference.

3. **Remove redundant constructor calls**: Remove `setInbox(INBOX_ADDRESS)` and `configureCoti(MPC_EXECUTOR_ADDRESS, COTI_CHAIN_ID)` from the constructor body. `PodUserSepolia`'s constructor already performs both calls. The constructor should only contain the `PodLibBase(msg.sender)` base initializer.

4. **No changes to DirectMessagePod.sol**: The COTI-side contract already follows the correct pattern and requires no modifications.

5. **No changes to function bodies**: `sendMessage`, `onMessageReceived`, `setCotiContract`, and the `IDirectMessagePod` interface remain exactly as-is. The fix is purely structural.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Statically analyze the `DirectMessageEvm.sol` source to confirm the inheritance and constructor deviations. Compile both the unfixed and fixed versions to compare bytecode and ABI.

**Test Cases**:
1. **Inheritance Check**: Parse `DirectMessageEvm.sol` and assert the inheritance list contains `PodLibBase` instead of `PodLib` (will pass on unfixed code, confirming the bug)
2. **Constructor Redundancy Check**: Parse the constructor body and assert it contains `setInbox` and `configureCoti` calls alongside `PodUserSepolia` inheritance (will pass on unfixed code, confirming the bug)
3. **Compilation Check**: Compile the unfixed contract and verify it compiles successfully but with the wrong inheritance (confirms no compile error masks the bug)

**Expected Counterexamples**:
- The unfixed source contains `PodLibBase` in the inheritance list where `PodLib` is expected
- The unfixed constructor body contains redundant `setInbox`/`configureCoti` calls
- Possible causes: copy-paste from pre-PodLib template, misunderstanding of PodUserSepolia constructor behavior

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed source produces the expected structure.

**Pseudocode:**
```
FOR ALL contractSource WHERE isBugCondition(contractSource) DO
  fixedSource := applyFix(contractSource)
  ASSERT fixedSource.inheritanceList CONTAINS "PodLib"
  ASSERT fixedSource.inheritanceList NOT CONTAINS "PodLibBase"
  ASSERT fixedSource.constructorBody NOT CONTAINS call("setInbox")
  ASSERT fixedSource.constructorBody NOT CONTAINS call("configureCoti")
  ASSERT compilesSuccessfully(fixedSource)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (i.e., runtime function calls), the fixed contract produces the same result as the original contract.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT DirectMessageEvm_original(input) = DirectMessageEvm_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Compile both the unfixed and fixed contracts. Compare their ABI outputs to confirm no function signatures changed. Deploy both in a test environment and verify identical behavior for `sendMessage`, `onMessageReceived`, and `setCotiContract` calls.

**Test Cases**:
1. **ABI Preservation**: Verify the fixed contract's ABI is identical to the original (same function signatures, events, and errors)
2. **sendMessage Preservation**: Verify `sendMessage` dispatches the same `MpcMethodCall` payload with the same selectors and fee routing
3. **Callback Preservation**: Verify `onMessageReceived` decodes and emits the same `MessageReply` event
4. **Owner Function Preservation**: Verify `setCotiContract` continues to update the MPC executor address

### Unit Tests

- Verify the fixed contract compiles with `PodLib, PodUserSepolia` inheritance
- Verify the constructor initializes `inbox`, `mpcExecutorAddress`, and `cotiChainId` correctly via `PodUserSepolia`
- Verify `sendMessage` constructs the correct `MpcMethodCall` and dispatches via `_sendTwoWayWithFee`
- Verify `onMessageReceived` decodes `(bytes32, string)` and emits `MessageReply`

### Property-Based Tests

- Generate random valid `itString` and recipient address inputs and verify `sendMessage` produces consistent `MpcMethodCall` payloads on the fixed contract
- Generate random `resultData` payloads and verify `onMessageReceived` decodes and emits correctly
- Verify that for any valid owner address, `setCotiContract` updates the executor address identically on both original and fixed contracts

### Integration Tests

- Deploy `DirectMessageEvm` (fixed) and `DirectMessagePod` with mock Inbox contracts and verify end-to-end message flow
- Verify `sendMessage` → relay → `receiveMessage` → `inbox.respond` → `onMessageReceived` callback chain works correctly
- Verify error path: trigger `onDefaultMpcError` and confirm `ErrorRemoteCall` event is emitted with correct data
