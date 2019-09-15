const kms = require("@google-cloud/kms");

module.exports = () => {
  const client = new kms.KeyManagementServiceClient();
  return client.cryptoKeyVersionPath(
    process.env.GCP_PROJECT,
    process.env.KEY_LOCATION,
    process.env.KEY_RING,
    process.env.KEY,
    process.env.KEY_VERSION
  );
};
