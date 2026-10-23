# @blossm/contract-addresses-trusted-forwarder

Static Juicebox V6 `ERC2771Forwarder` deployment lookup. Source records are
pinned to `Bananapus/deploy-all-v6` commit
`c62b3ac81bfc5603b6771e8ad801eb2236022947`. Lookup performs no network requests.

```js
import contracts from "@blossm/contract-addresses-trusted-forwarder";

const address = contracts.erc2771ForwarderContract(1);
```

## erc2771ForwarderContract(chainId)

Accepts a positive safe-integer JavaScript number from the supported-chain
table. Returns the lowercase V6 address string. Numeric strings, arrays,
objects, fractions, zero and other invalid values are rejected without coercion.

Invalid input throws the shared `@blossm/errors` internal-server error with
`chainId must be a positive safe integer`. Unsupported numeric IDs throw the
same error type with `Unsupported chainId: <id>`. These report unsupported
configuration; no fallback address is selected. Only own table entries count.

## Supported V6 deployment records

All eight records point to `0x3ba60b60933916a7c87d0860dcee62a0ce34e3e2`.
Polygon is not supported by this pinned table.

| Chain            |       ID | Deployment directory | Artifact SHA256                                                    |
| ---------------- | -------: | -------------------- | ------------------------------------------------------------------ |
| Ethereum         |        1 | `ethereum`           | `fe4b86b2945907e5e8e467c894e1dc5653a116a51a4c561bd536c2e5bc47d1c8` |
| Optimism         |       10 | `optimism`           | `22b2afda37e1e21fd37ab00e12cc6512d824d083ca193dd30a207378e83e988d` |
| Base             |     8453 | `base`               | `2d445573481b9afa3555e6e5fa12dea53fad7a7283f5acb742c97274c0f352fd` |
| Arbitrum         |    42161 | `arbitrum`           | `5e466bce4fc88915038ec59c0136d9764aa627755d2fa14a995900ef51cb0f95` |
| Ethereum Sepolia | 11155111 | `sepolia`            | `4acf67e1b2fd496fcdfe0af8ad351e9f10449714617b26055cfa56f9a04b7991` |
| Base Sepolia     |    84532 | `base_sepolia`       | `cec05b9232236b937fd5715372517c32f97f11cefdd6c685e52100aff7684b14` |
| Optimism Sepolia | 11155420 | `optimism_sepolia`   | `b26a655cb20d7c111568b84b19d5f3d551d20fe21754f2d11a1667a112482268` |
| Arbitrum Sepolia |   421614 | `arbitrum_sepolia`   | `cf7a8d6da3a7a5c79d5a460ca6c9895ac72081921c3d0b81ff6720aab80351fa` |

This lookup explicitly selects the Juicebox V6 deployment family. It does not
fall back to historical V4/V5 forwarders, discover arbitrary ERC-2771
contracts, verify an RPC endpoint's chain, or prove that a target trusts the
forwarder. Callers own those checks and the contract's EIP-712 domain/signing
configuration. The pinned artifacts record constructor name `Juicebox`;
callers must verify the actual signing domain instead of assuming an app name.

## Provenance

- Repository: `Bananapus/deploy-all-v6`.
- [Pinned deployment-source revision](https://github.com/Bananapus/deploy-all-v6/tree/c62b3ac81bfc5603b6771e8ad801eb2236022947).
- [Ethereum deployment artifact](https://github.com/Bananapus/deploy-all-v6/blob/c62b3ac81bfc5603b6771e8ad801eb2236022947/deployments/ethereum/ERC2771Forwarder.json).
- Artifact paths: `deployments/<directory>/ERC2771Forwarder.json`, with directory/hash pairs above.
- Sorted `[chainId, lowercaseAddress]` projection SHA256: `2529ebbf4c7a7855d1d91e210fa75630ba451aa0185790d54cd17e2778703932`.

Verified 2026-10-22 from the local deployment repository: all eight artifact
bytes match the pinned commit, chain IDs match the table, and each recorded
receipt has successful status. All eight artifact ABIs match the retained
`@blossm/contract-abis-trusted-forwarder` interface. The old WIP selected V5;
the user explicitly selected V6 before this package was committed.

No fresh chain RPC, canonical receipt or deployed-bytecode check was performed.
The successful receipts are committed source evidence, not a live-state claim.
These artifact hashes and source revision allow the data comparison to be
repeated from another checkout without access to this machine's paths.

The address checksum hashes JSON-serialized pairs sorted numerically by chain
ID. An update needs reviewed V6 deployment records and a deliberate update of
the table, provenance and test checksum. Normal tests are offline.

## Dependencies and tests

Runtime dependency: `@blossm/errors`, provided through `deps.js` in the standard
Toolbox pattern. Package-local tests use Mocha/Chai and Node's built-in crypto;
no mocks or additional runtime dependencies are required.

From this directory with workspace dependencies installed:

```sh
node ../../../../../node_modules/mocha/bin/mocha.js --recursive
```

Tests pin all eight returned V6 addresses to the source-derived checksum and
cover malformed/coercing inputs, unsupported chains, shared error semantics
and inherited numeric properties.
