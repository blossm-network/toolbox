Creates, decodes and verifies Blossm tokens. `decode` returns `{ headers, claims }`
and does not establish authenticity. `validate` verifies the signature, configured
algorithm, audience and time bounds before returning claims.

The existing wire format uses ISO date strings for exp, nbf and iat, with
`expiresIn` and `activeIn` expressed in milliseconds. Validation requires a
parseable string exp, accepts an optional parseable string nbf, and rejects at
the exact expiration instant. Missing or malformed expiry is rejected. Numeric
JWT dates are not accepted as legacy dates. Audience arrays are currently encoded
as a comma-separated string. Signing and verification callbacks own the signature
bytes; the existing KMS integration uses DER ECDSA bytes. This is a legacy Blossm
format rather than complete JOSE interoperability. A standard JWT rollout must
coordinate consumers and preserve existing token lifetimes explicitly.

`create` and `validate` also accept `format: "jose"` explicitly. That format
preserves audience arrays, emits NumericDate seconds (including fractional
seconds), and converts ECDSA signatures between the DER callbacks and standard
JOSE R||S bytes. ES256, ES384 and ES512 are supported. The callback contract stays
unchanged: signFn returns base64 DER, and verifyFn receives base64 DER. Durations
remain milliseconds in both formats. Unknown formats and unsupported JOSE
algorithms are rejected. Validation requires exactly three token segments.

```js
const token = await create({ options, payload, signFn, format: "jose" });
const claims = await validate({
  token, verifyFn, audience, algorithm: "ES256", format: "jose",
});
```

Existing authentication middleware and generated gateways use the legacy default;
this library option does not switch deployed authentication. Activation requires
explicit format configuration through those consumers, paired issuance and
verification, and a bounded plan for outstanding legacy tokens. Select the format
from trusted route/key configuration, not an unverified claim or heuristic retry.
Keep legacy verification on its designated path until old tokens expire, then
remove that path. No stored events, hashes or existing tokens are rewritten.
