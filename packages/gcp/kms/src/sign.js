const kms = require("@google-cloud/kms");
const crypto = require("crypto");

const versionPath = require("./_version_path");

module.exports = async message => {
  const client = new kms.KeyManagementServiceClient();

  const digest = crypto
    .createHash("SHA256")
    .update(message)
    .digest();

  const [{ signature }] = await client.asymmetricSign({
    name: versionPath(),
    digest: { sha256: digest }
  });

  return signature;
};
