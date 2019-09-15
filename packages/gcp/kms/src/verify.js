const crypto = require("crypto");

const versionPath = require("./_version_path");
const kms = require("@google-cloud/kms");

let publicKeys = {};

module.exports = async ({ message, signature }) => {
  if (publicKeys[process.env.GCP_PROJECT] == undefined) {
    const client = new kms.KeyManagementServiceClient();
    const [{ pem }] = await client.getPublicKey({
      name: versionPath()
    });

    publicKeys[process.env.GCP_PROJECT] = pem;
  }

  return crypto
    .createVerify("SHA256")
    .update(message)
    .verify(publicKeys[process.env.GCP_PROJECT], signature, "uncompressed");
};
