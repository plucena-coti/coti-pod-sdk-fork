# Fees And Pricing

## Purpose

Use this reference whenever building or converting PoD request flows. Fee handling is mandatory for successful remote execution and callback delivery.

## Core Model

- Every outbound request must carry fee value in local native token (for example ETH).
- Inbox converts local token value to gas-unit budgets.
- For two-way flows, budget both legs:
  - Remote execution leg (`Request.targetFee` gas units on remote side).
  - Callback leg (`Request.callerFee` gas units for response/error back).
- `sendTwoWayMessage` takes `callbackFeeLocalWei` and uses `msg.value` as total fee.

## Mandatory Estimation API

Use Inbox fee manager estimator before dispatch:

`calculateTwoWayFeeRequiredInLocalToken(remoteMethodCallSize, callBackMethodCallSize, remoteMethodExecutionGas, callBackMethodExecutionGas, gasPrice)`

Interpretation:

- `remoteMethodCallSize`: encoded payload size for remote method.
- `callBackMethodCallSize`: encoded callback payload size.
- `remoteMethodExecutionGas`: expected remote computation gas.
- `callBackMethodExecutionGas`: expected callback execution gas on source chain.
- `gasPrice`: local gas price assumption.

Returns:

- Estimated remote leg cost expressed in local token terms.
- Estimated callback leg cost in local token terms.

## Practical Assumptions

- Assume same gas price for forward and callback legs unless explicitly modeling otherwise.
- Add safety headroom above estimator output (buffer).
- Ensure `callbackFeeLocalWei` is:
  - Greater than zero.
  - Less than or equal to total fee (`msg.value`).
  - Large enough to cover callback path complexity.

## Dispatch Patterns

Using `PodLib` helpers:

- Provide `msg.value` as total fee budget.
- Pass explicit `callbackFeeLocalWei`.
- Library forwards values into Inbox two-way send.

Direct Inbox calls:

- Call `sendTwoWayMessage{value: totalFee}(..., callbackFeeLocalWei)`.
- Keep fee math and callback slice visible in code for audits/reviews.

## Validation And Failure Behavior

- Underfunded total fee can revert with fee-related errors (for example target fee too low).
- Underfunded callback slice can revert with callback fee errors.
- Treat fee-related failures as first-class test scenarios.

## Test Guidance

At minimum include:

1. Success case with estimated+buffered fees.
2. Revert case with too-low total fee.
3. Revert case with too-low callback fee.
4. Two-way response path where callback budget is consumed as expected.
