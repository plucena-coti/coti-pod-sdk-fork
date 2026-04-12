# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** — Wrong Inheritance and Redundant Constructor in DirectMessageEvm
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists in `contracts/examples/DirectMessageEvm.sol`
  - **Scoped PBT Approach**: The bug is deterministic and structural — scope the property to the concrete `DirectMessageEvm.sol` source file
  - Create test file `tests/fix-messages/bug-condition.test.ts` using vitest
  - Read `contracts/examples/DirectMessageEvm.sol` source and assert:
    - The inheritance list contains `PodLib` (not `PodLibBase`) — i.e., matches pattern `is PodLib, PodUserSepolia`
    - The constructor body does NOT contain `setInbox(` call
    - The constructor body does NOT contain `configureCoti(` call
  - These assertions encode the expected (fixed) behavior from the design's `isBugCondition` pseudocode
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (inheritance contains `PodLibBase` instead of `PodLib`, and constructor contains redundant `setInbox`/`configureCoti` calls — this proves the bug exists)
  - Document counterexamples found: `DirectMessageEvm` inherits `PodLibBase` where `PodLib` is expected; constructor redundantly calls `setInbox(INBOX_ADDRESS)` and `configureCoti(MPC_EXECUTOR_ADDRESS, COTI_CHAIN_ID)` despite `PodUserSepolia` already doing so
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** — Runtime Behavior and ABI Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Create test file `tests/fix-messages/preservation.test.ts` using vitest
  - Observe on UNFIXED code: compile `DirectMessageEvm.sol` with Hardhat and capture the ABI (function signatures, event signatures, error selectors)
  - Observe on UNFIXED code: verify the compiled artifact contains `sendMessage`, `onMessageReceived`, `setCotiContract`, `onDefaultMpcError`, `requestSenders` functions and `MessageDispatched`, `MessageReply`, `ErrorRemoteCall` events
  - Write property-based tests that for all public/external function entries in the ABI, the function signature, input types, and output types are preserved
  - Write property-based test that for all event entries in the ABI, the event name and parameter types are preserved
  - Verify the `IDirectMessagePod` interface selector (`receiveMessage(gtString,address)`) is present in the artifact
  - Verify the import of `PodLibBase` or `PodLib` does not change the ABI surface — the contract exposes the same external interface regardless of which base is inherited
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline ABI and runtime interface to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix DirectMessageEvm inheritance and constructor

  - [x] 3.1 Implement the fix in `contracts/examples/DirectMessageEvm.sol`
    - Change import from `import {PodLibBase} from "../mpc/PodLibBase.sol"` to `import {PodLib} from "../mpc/PodLib.sol"`
    - Change inheritance from `contract DirectMessageEvm is PodLibBase, PodUserSepolia` to `contract DirectMessageEvm is PodLib, PodUserSepolia`
    - Remove `setInbox(INBOX_ADDRESS);` from constructor body
    - Remove `configureCoti(MPC_EXECUTOR_ADDRESS, COTI_CHAIN_ID);` from constructor body
    - Constructor should remain `constructor() PodLibBase(msg.sender) {}` with empty body (or just braces)
    - No changes to `sendMessage`, `onMessageReceived`, `setCotiContract`, `IDirectMessagePod` interface, events, or state variables
    - No changes to `DirectMessagePod.sol`
    - _Bug_Condition: isBugCondition(contractSource) where contractSource.inheritanceList CONTAINS "PodLibBase" AND NOT "PodLib", OR constructorBody CONTAINS call("setInbox") AND call("configureCoti") alongside PodUserSepolia_
    - _Expected_Behavior: Fixed source inherits PodLib, PodUserSepolia; constructor body contains no redundant setInbox/configureCoti calls_
    - _Preservation: All runtime behavior — sendMessage dispatch, onMessageReceived callback, setCotiContract, onDefaultMpcError error handling — unchanged_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** — Correct Inheritance and Constructor
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior (inherits `PodLib`, no redundant constructor calls)
    - Run bug condition exploration test from step 1: `npx vitest run tests/fix-messages/bug-condition.test.ts`
    - **EXPECTED OUTCOME**: Test PASSES (confirms inheritance is now `PodLib, PodUserSepolia` and constructor body is clean)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** — Runtime Behavior and ABI Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2: `npx vitest run tests/fix-messages/preservation.test.ts`
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions — ABI surface, function signatures, events all identical)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint — Ensure all tests pass
  - Run full test suite: `npx vitest run tests/fix-messages/`
  - Verify both bug-condition and preservation tests pass
  - Verify the fixed contract compiles successfully with Hardhat: `npx hardhat compile`
  - Ensure all tests pass, ask the user if questions arise
