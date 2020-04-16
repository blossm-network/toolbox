const crypto = require("crypto");

const kms = require("@google-cloud/kms");

let publicKeys = {};

module.exports = ({ key, ring, location, version, project }) => async ({
  message,
  signature,
}) => {
  const instanceKey = `${project}.${ring}.${key}`;
  if (publicKeys[instanceKey] == undefined) {
    const client = new kms.KeyManagementServiceClient();

    const versionPath = client.cryptoKeyVersionPath(
      project,
      location,
      ring,
      key,
      version
    );

    const [{ pem }] = await client.getPublicKey({
      name: versionPath,
    });

    publicKeys[instanceKey] = pem;
  }

  return crypto
    .createVerify("SHA256")
    .update(message)
    .verify(publicKeys[instanceKey], signature, "base64");
};
