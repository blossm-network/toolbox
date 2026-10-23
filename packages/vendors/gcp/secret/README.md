Tools for accessing a secret.

required env vars:
GCP_SECRET_BUCKET, GCP_KMS_SECRET_BUCKET_KEY_RING, GCP_KMS_SECRET_BUCKET_KEY_LOCATION, GCP_PROJECT

Secret creation uses a unique local encrypted filename per operation and a
stable `${key}.txt.encrypted` object destination. Both reads and writes clean up
their local file after success or failure. If cleanup also fails, the original
operation failure is preserved. A cleanup failure after a successful operation
still rejects. KMS key creation ignores only AlreadyExists errors.

Only encrypted data is written locally. The KMS decryption helper returns
trimmed UTF-8 text; this is not an arbitrary binary-secret interface.
