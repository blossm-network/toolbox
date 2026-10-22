# @blossm/erc2771

Prepare locally signed `execute` calldata for the pinned Juicebox V6 forwarder.
This internal library reads the forwarder's domain and nonce, binds the reported
domain chain to the requested chain, signs locally and encodes the call.

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
});
```

## Contract

`signErc2771ForwardRequest(options)` returns `Promise<hex>` containing an
encoded forwarder `execute(request)` call. Callers supply clean inputs:

- `chainId`: supported numeric chain ID from the V6 address package.
- `rpcUrl`: explicit HTTP(S) endpoint, handled by `@blossm/providers`.
- `privateKey`: hexadecimal secp256k1 key from the custody/caller layer.
- `forwardRequestData`: validated `from`, `to`, `value`, `gas` and `data`.
  The caller ensures `from` corresponds to the signing key.
- `value`, `gas`: clean uint256 values converted with native `BigInt`.
- `deadline`: clean uint48 Unix seconds converted with `BigInt`. The caller
  owns deadline selection and freshness, including whether to sign at all.

Procedure `validateFn` and the shared validation libraries own caller-input
validation. Viem owns account construction, RPC/ABI decoding and signing/encoding.
The signer does not revalidate input shapes or formats, sender consistency,
deadline freshness or execution readiness.

## Signing

The [V6 address owner](../contractAddresses/trustedForwarder/README.md) selects the
contract, and the [ABI owner](../contractAbis/trustedForwarder/README.md) defines
its interface. The signer assumes the pinned V6 contract's standard four-field
EIP-712 domain: name, version, chain ID and verifying contract. It uses those
reported values, refusing a domain chain that differs from the requested chain.
It does not negotiate arbitrary EIP-712 layouts or assert caller-supplied names.
The former `domainName` and `version` options are no longer part of the API;
extra JavaScript properties are ignored and cannot override the reported domain.

Domain and `nonces(signingAccount)` are read at latest state. There is no
additional chain/block RPC call or block pinning. A read nonce is not reserved;
state changes or another request can make the signature stale. The caller owns
reconciliation and any fresh preparation.

The signed ForwardRequest type follows the
[OpenZeppelin reference source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.4.0/contracts/metatx/ERC2771Forwarder.sol).
Its nonce comes from the contract. The encoded execute tuple contains `from`,
`to`, `value`, `gas`, `deadline`, `data` and the local signature, without nonce.
Caller nonce/signature/nested-deadline fields are not used.

Key-parser failures are redacted using `@blossm/errors.invalidArgument` without
retaining a secret-bearing cause. A reported chain mismatch uses the shared
internal-server error; other read/conversion/signing/encoding errors propagate.
Private keys are never passed to RPC, and no signing/submission RPC is made.

## Caller responsibilities

Custody, authorization, sender consistency, numeric/input validation, deadline
policy, target trust, simulation, funding, submission and receipts belong to
callers and their existing owners. Returning signed calldata proves preparation,
not contract acceptance or completed execution.

Dia still has independent custody, validation and transaction workflow defects.
Its legacy domain-name/version properties are ignored by this helper; this does
not establish that the complete Dia flow is ready.

## Tests

Uses Toolbox's ESM `index.js` / injectable `deps.js` and package-local
Mocha/Chai/Sinon conventions. Tests retain real local viem cryptography and ABI
codecs over simulated contract reads with a synthetic key. From this directory:

```sh
node ../../../../node_modules/mocha/bin/mocha.js --recursive
```

Checks cover two-chain signature recovery and replay rejection, actual domain
metadata, large nonce and integer boundaries, caller override filtering,
chain binding, key-error redaction and read failures. All recorded RPC methods
are `eth_call`; no network, chain/block lookup, signing RPC or transaction
submission is performed by the tests.
