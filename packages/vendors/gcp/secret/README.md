Tools for accessing a secret.

required env vars:
GCP_SECRET_BUCKET, GCP_KMS_SECRET_BUCKET_KEY_RING, GCP_KMS_SECRET_BUCKET_KEY_LOCATION, GCP_PROJECT


Each read/write owns a unique local ciphertext filename. Remote objects retain
the stable `<key>.txt.encrypted` name. Cleanup runs after success or failure;
the original operation error wins if cleanup also fails. Only KMS AlreadyExists
(code6) is ignored during key creation. No cloud writes are automatically retried.
