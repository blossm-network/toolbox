# @blossm/contract-abis-trusted-forwarder

Static ABI data matching OpenZeppelin Contracts 5.4.0's `ERC2771Forwarder`.
There are no runtime dependencies or external effects.

```js
import abis from "@blossm/contract-abis-trusted-forwarder";

const abi = abis.trustedForwarderContractABI;
```

## Interface

The export contains the constructor, five functions (`eip712Domain`, `execute`,
`executeBatch`, `nonces`, `verify`), two events and nine custom errors from the
pinned artifact. Treat the shared array as read-only; it is not frozen.

`execute` accepts one request tuple, and `executeBatch` accepts an array of the
same tuple plus a refund receiver:

```text
from       address
to         address
value      uint256
gas        uint256
deadline   uint48
data       bytes
signature  bytes
```

The request tuple contains no nonce field. The nonce is read through
`nonces(owner)` and included in the signed typed data by the signing layer.
Contract addresses, chain configuration, domain values and signing remain the
caller's responsibility. Matching this ABI does not verify any deployed
address or contract behavior.

## Pinned matching reference

The existing 17 ABI entries were compared with the published artifact and
matched exactly, including parameter names, internal types, events and errors.
This identifies a verified matching reference; the original WIP's source
history is not established.

- Release: `@openzeppelin/contracts@5.4.0`.
- [Tagged contract source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.4.0/contracts/metatx/ERC2771Forwarder.sol).
- [Official npm release archive](https://registry.npmjs.org/@openzeppelin/contracts/-/contracts-5.4.0.tgz), member `package/build/contracts/ERC2771Forwarder.json`.
- [Published artifact mirror](https://unpkg.com/@openzeppelin/contracts@5.4.0/build/contracts/ERC2771Forwarder.json).
- Release archive integrity: `sha512-eCYgWnLg6WO+X52I16TZt8uEjbtdkgLC0SUX/xnAksjjrQI4Xfn4iBRoI5j55dmlOhDv1Y7BoR3cU7e3WWhC6A==`.
- Artifact file SHA256: `d67d9f8322423f8efb19c3447a928ec20d917837ed8809a64cefac6c374ce089`.
- Sorted serialized ABI entries SHA256: `0bb81fff2d9988faf96902ab3910e3af3ca306a40c1baebb8d19a1f262a59f0b`.

The ABI checksum hashes `abi.map(entry => JSON.stringify(entry)).sort().join("\n")`.
It ignores top-level entry order while preserving each entry's parameter and
tuple order. The local array order differs from the published artifact and is
preserved for existing consumers.

Verified 2026-10-22 against the official release archive and its registry
integrity metadata. The artifact mirror was byte-identical to the archive
member. The ABI content is preserved unchanged; JavaScript formatting and the
export wrapper are local. The upstream MIT [license](LICENSE) is included.

For an update, review the intended contract release, verify the downloaded
archive against its published integrity, compare the ABI, then update both
provenance and the integrity assertion deliberately. Normal tests are offline.

## Tests

Package-local Mocha/Chai tests use viem as a development dependency to check
source integrity, exact selectors, request/batch encoding, view result decoding,
events and revert payloads. No mocking libraries are needed.

From this directory with workspace dependencies installed:

```sh
node ../../../../node_modules/mocha/bin/mocha.js --recursive
```
