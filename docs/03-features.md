# Features

## Contract-side features

| Capability | Where it comes from | Why it matters |
|---|---|---|
| Async cross-domain request/response | `/contracts/IInbox.sol` | Private operations complete through callbacks, not sync return values |
| Callback authorization | `/contracts/InboxUser.sol` (`onlyInbox`) | Prevents arbitrary callers from injecting fake callback data |
| Built-in common private methods | `/contracts/mpc/PodMpcLib.sol` (`add`, `gt`) | Fast path for common operations without custom COTI contract |
| Configurable target executor/chain | `/contracts/mpc/MpcUser.sol` | Lets app point to desired COTI executor and chain ID (integrator must add access control) |
| Typed argument encoding | `/contracts/mpccodec/MpcAbiCodec.sol` | Keeps argument schemas deterministic and ABI-aligned |
| Type declarations and conversions | `/contracts/utils/mpc/MpcCore.sol` | Defines `it*`, `ct*`, `gt*` and conversion operations |

## Client-side features

| Capability | Where it comes from | Why it matters |
|---|---|---|
| Encryption service integration | `/src/coti-pod-crypto.ts` `CotiPodCrypto.encrypt` | Simple UX path for building encrypted payloads |
| Local decryption helper | `/src/coti-pod-crypto.ts` `CotiPodCrypto.decrypt` | Converts contract ciphertext to plaintext using AES key |
| Low-level typed crypto utilities | `@coti-io/coti-sdk-typescript` | Build signed typed input payloads and recover account key |

## Operationally important properties

- Privacy execution is asynchronous and request-ID-driven.
- Callback ABI decode must match COTI response encode exactly.
- Type boundaries (`it*`, `ct*`, `gt*`) are required for correctness.
- Key management on client side is part of production app security, not optional.
