# Contract patterns and production checklist

Use this checklist before deploying a production privacy contract.

## Recommended contract shape

1. Inherit from `PodMpcLib` (or `InboxUser` for custom mode).
2. Accept private values as `it*` on EVM entrypoints.
3. Submit request via `PodMpcLib` or `inbox.sendTwoWayMessage(...)`.
4. Store `requestId` correlation state.
5. Implement callback and error callback with `onlyInbox`.
6. Decode callback into `ct*` and persist.
7. Expose status/result readers for async UX.

## Critical security controls

- Access-control any method that changes routing/config.
- Specifically gate any call path that invokes `configureCoti(...)`.
- Keep callback handlers `onlyInbox`.
- Avoid external calls before state update inside callback handlers.

## ABI correctness checklist

- Selector in `MpcAbiCodec.create(...)` matches COTI-side target function.
- `.addArgument(...)` order matches COTI function parameter order.
- Callback `abi.decode(...)` tuple matches COTI `abi.encode(...)` tuple exactly.
- Add regression tests when callback tuple schema changes.

## Async robustness checklist

- Request starts as `PENDING` and transitions to terminal state.
- Unknown or duplicate callback handling is defined.
- Errors are observable (`requestId`, error code, message).
- Frontend can query status by request ID.

## Privacy/type checklist

- No plaintext sensitive values in EVM storage.
- No `gt*` in EVM public interfaces.
- `ct*` used for user-decryptable outputs.
- Type width consistency preserved through full flow.

## Observability checklist

- Emit request-created event with indexed `requestId`.
- Emit completion event.
- Emit failure event.
- Include key business identifiers in events when useful.

## Testing checklist

- Success callback updates expected state.
- Non-Inbox callback call reverts.
- Error callback updates failure state.
- Request ID mapping is deterministic.
- Frontend integration can decrypt returned ciphertext correctly.
