const kms = require("@google-cloud/kms");

module.exports = () => {
  const client = new kms.KeyManagementServiceClient();
  return client.cryptoKeyVersionPath(
    process.env.GCP_PROJECT,
    "global",
    "auth-token",
    "sign",
    "1"
  );
};
