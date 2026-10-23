Cloud KMS encryption, decryption, public keys, signatures and verification.

Pass `project`, `location`, `ring` and `key` explicitly. Public-key retrieval,
signing and verification also require `version`. This package does not read
those arguments from environment variables; deployment composition supplies them.

`createKey` creates a symmetric ENCRYPT_DECRYPT key. `encrypt` accepts text and
returns encoded ciphertext (base64 by default). `decrypt` accepts base64
ciphertext and returns UTF-8 text with surrounding whitespace trimmed. This is
an existing text-secret contract, not byte-preserving decryption.

`sign` hashes the message with SHA-256 and uses the selected asymmetric signing
key version. Choose a compatible key algorithm. Encoding defaults to base64;
encoding the signature does not itself construct a JWT or convert its signature
format. `verify` caches public keys by their complete key-version resource name.
Local verification does not recheck the remote key's enabled/disabled state on
cache hits; revocation policy belongs to the consuming authentication flow.

The adapter does not currently verify KMS request/response CRC32C fields. See
[Google's integrity guidance](https://docs.cloud.google.com/kms/docs/data-integrity-guidelines)
when choosing the required integrity guarantees for a consuming data path.
