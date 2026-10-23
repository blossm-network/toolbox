Tools for accessing text secrets through KMS and Cloud Storage.

`create(key, message, options)` and `get(key, options)` accept `project`, `ring`,
`location` and `bucket`. Omitted options default to GCP_PROJECT,
GCP_KMS_SECRET_BUCKET_KEY_RING, GCP_KMS_SECRET_BUCKET_KEY_LOCATION and
GCP_SECRET_BUCKET respectively.

Each read/write owns a unique local ciphertext filename. Remote objects retain
the stable `<key>.txt.encrypted` name. Cleanup runs after success or failure;
the original operation error wins if cleanup also fails. A missing local file
is ignored; other cleanup failures reject after an otherwise successful operation.
Only KMS AlreadyExists (code6) is ignored during key creation. No cloud writes
are automatically retried. A process crash or failed cleanup can leave ciphertext
files locally; this helper does not implement crash recovery.

Only ciphertext is written locally. The KMS decryption helper returns trimmed
UTF-8 text; this is not an arbitrary binary-secret interface.
