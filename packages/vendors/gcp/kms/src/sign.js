const kms = require("@google-cloud/kms");
const crypto = require("crypto");

module.exports = async ({
  message,
  format = "base64",
  key,
  ring,
  location,
  version,
  project,
}) => {
  const client = new kms.KeyManagementServiceClient();

  const digest = crypto.createHash("SHA256").update(message).digest();

  const versionPath = client.cryptoKeyVersionPath(
    project,
    location,
    ring,
    key,
    version
  );

  const [{ signature }] = await client.asymmetricSign({
    name: versionPath,
    digest: { sha256: digest },
  });

  return signature.toString(format);
};
