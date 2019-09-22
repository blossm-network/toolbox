const kms = require("@google-cloud/kms");

module.exports = () => {
  const client = new kms.KeyManagementServiceClient();
  return client.cryptoKeyPath(
    process.env.GCP_PROJECT,
    process.env.GCP_KMS_KEY_LOCATION,
    process.env.GCP_KMS_KEY_RING,
    process.env.GCP_KMS_KEY
  );
};
