Creates, decodes and verifies Blossm tokens. `decode` returns `{ headers, claims }`
and does not establish authenticity. `validate` verifies the signature, configured
algorithm, audience and time bounds before returning claims. Tokens must have
exactly three nonempty, canonical base64url segments; malformed encoding is
rejected before calling the verifier.

The existing wire format uses ISO date strings for exp, nbf and iat, with
`expiresIn` and `activeIn` expressed in milliseconds. Validation requires a
parseable string exp, accepts an optional parseable string nbf, and rejects at
the exact expiration instant. Missing or malformed expiry is rejected. Numeric
JWT dates are not accepted as legacy dates. Audience arrays are currently encoded
as a comma-separated string. Signing and verification callbacks own the signature
bytes; the existing KMS integration uses DER ECDSA bytes. This is a legacy Blossm
format rather than complete JOSE interoperability. Any change to standard JWT representation must update issuance, authentication,
cache readers and cookie expiry together.
