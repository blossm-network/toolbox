# @blossm/providers

Construct read-only viem public clients from explicit HTTP or HTTPS RPC URLs.

```js
import providers from "@blossm/providers";

const client = providers.getProvider(process.env.ETHEREUM_RPC_URL);
const chainId = await client.getChainId();
```

## getProvider(rpcUrl)

Accepts an absolute HTTP or HTTPS URL string and returns a new viem public
client. The URL is passed unchanged to viem's HTTP transport. Construction
does not send an RPC request; requests happen when client actions are called.

Missing URLs throw the shared `@blossm/errors` internal-server error with
`rpcUrl is required`. Malformed URLs, non-string values and unsupported
protocols throw the same error type with
`rpcUrl must be an absolute HTTP or HTTPS URL`. These are configuration errors;
their messages do not include the supplied URL. Construction errors from viem
propagate unchanged. Later RPC failures belong to the client action being called.

Callers own endpoint configuration, chain identity checks and handling RPC
results. This package supplies no default URL, chain selection, caching, wallet
signer or transaction submission API. A constructed client does not establish
that an endpoint is reachable or serves the intended chain.

## Tests

The package uses Toolbox's ESM `index.js` / injectable `deps.js` pattern and
package-local Mocha, Chai and Sinon tests. From this directory, using installed
workspace dependencies:

```sh
node ../../../../node_modules/mocha/bin/mocha.js --recursive
```

Tests cover dependency forwarding, real offline viem client construction,
invalid configuration and propagation of construction failures. They make no
network requests.
