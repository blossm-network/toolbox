# @blossm/erc2771

Prepare locally signed `execute` calldata for the pinned Juicebox V6
ERC2771Forwarder. This package performs public chain reads and local signing;
it does not submit a transaction or make RPC signing requests.

```js
import erc2771 from "@blossm/erc2771";

const calldata = await erc2771.signErc2771ForwardRequest({
  chainId: 8453,
  rpcUrl,
  privateKey,
  deadline: deadlineUnixSeconds,
  forwardRequestData: {
    from: accountAddress,
    to: targetAddress,
    value: "0",
    gas: "200000",
    data: targetCalldata,
  },
  // Optional assertions against the contract's reported domain:
  domainName: "Juicebox",
  version: "1",
});
```

## Contract

`signErc2771ForwardRequest(options)` returns `Promise<hex>` containing an
encoded forwarder `execute(request)` call. The relay or execution layer owns
submission to the [V6 forwarder address](../contractAddresses/trustedForwarder/README.md),
including any native value required by the request.

- `chainId`: supported positive safe-integer number, resolved by the address package.
- `rpcUrl`: explicit HTTP(S) endpoint, validated by `@blossm/providers`.
- `privateKey`: hexadecimal secp256k1 private key, supplied by the custody/caller layer.
- `forwardRequestData`: object containing valid `from` and `to` addresses, `value`, `gas`, and even-length hex `data` (`0x` is allowed).
- `value`, `gas`: unsigned 256-bit integers. Accept bigint, safe-integer numbers, or canonical unsigned decimal strings. Gas must be positive; value may be zero.
- `deadline`: positive unsigned 48-bit Unix timestamp in seconds, with the same input forms. It must be later than the observed block timestamp.
- `domainName`, `version`: optional exact expectations for the reported signing domain. They never override it.

The private key becomes a local viem account and must match `from`. Its value
is never passed to an RPC. Invalid-key errors are sanitized without retaining
the key-parser cause. No logging is performed by this package.

## Chain and signing-domain checks

The endpoint's `eth_chainId` must match the requested chain. The signer reads
the latest block, validates the deadline against chain time, and pins both
`eip712Domain()` and `nonces(signer)` reads to that block number.

The V6 domain must report name/version/chain/contract fields (`0x0f`), no
extensions, the requested chain ID and the pinned forwarder address. The actual
reported name and version are used for EIP-712 signing. The deployment records
name the forwarder `Juicebox`; an application name such as `Blossm` is not an
interchangeable domain. A supplied expectation that disagrees causes an error.

The signed `ForwardRequest` includes the observed nonce. The returned ABI tuple
contains `from`, `to`, `value`, `gas`, `deadline`, `data`, and `signature`, with
no nonce field. Caller-provided nonce, signature or nested deadline fields do
not override the observed nonce or the top-level deadline.

The type schema corresponds to `_FORWARD_REQUEST_TYPEHASH` in the
[OpenZeppelin reference source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.4.0/contracts/metatx/ERC2771Forwarder.sol).
The [retained ABI](../contractAbis/trustedForwarder/README.md) matches the pinned
V6 deployment artifacts.

## Errors and limits

Malformed request/key fields, sender mismatch, expired deadlines and domain
expectation mismatches use `@blossm/errors.invalidArgument`. Unsupported chain
configuration is reported by the address package; wrong RPC chain, malformed
block evidence and incompatible reported domain use the shared internal-server
error. Public read and local signing/encoding failures propagate; there is no
fallback domain, nonce, chain or retry of an external mutation.

A prepared signature does not reserve a nonce. Another request or a chain
change can make it stale before submission. Block-number-pinned reads do not
prevent later reorgs. The caller owns reconciliation and any new preparation.
Signing does not prove target trust, simulation success, sufficient balance,
relay acceptance or eventual execution. This module does not allocate a
nonce, manage custody or enforce a product spending policy.

Dia's current caller still supplies `domainName: "Blossm"` and has independent
wallet WIP defects. That expectation must be removed or corrected when Dia is
repaired; this package intentionally rejects it.

## Tests

Uses Toolbox's ESM `index.js` / injectable `deps.js` and package-local
Mocha/Chai/Sinon conventions. Tests retain real viem accounts, signing, ABI
encoding/decoding and signature recovery, with only public RPC reads mocked
through an in-memory transport. All test keys are synthetic.

From this directory with workspace dependencies installed:

```sh
node ../../../node_modules/mocha/bin/mocha.js --recursive
```

Checks include cross-chain signature binding, exact integer boundaries,
block-pinned reads, optional expectations, malformed inputs and failed reads.
Every test asserts that RPC sees only public read methods and never the key.
No network requests or transaction submissions are made by the tests.
