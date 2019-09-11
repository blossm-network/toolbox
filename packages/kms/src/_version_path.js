const kms = require("@google-cloud/kms");

module.exports = () => {
  const client = new kms.KeyManagementServiceClient();
  return client.cryptoKeyVersionPath(
    process.env.GCP_PROJECT,
    "global",
    "core",
    "auth",
    "1"
  );
};
