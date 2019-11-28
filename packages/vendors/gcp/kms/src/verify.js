const crypto = require("crypto");

const kms = require("@google-cloud/kms");

let publicKeys = {};

module.exports = ({ key, ring, location, version, project }) => async ({
  message,
  signature
}) => {
  if (publicKeys[project] == undefined) {
    const client = new kms.KeyManagementServiceClient();

    //eslint-disable-next-line no-console
    console.log("slurp: ", {
      project,
      location,
      ring,
      key,
      version
    });

    const versionPath = client.cryptoKeyVersionPath(
      project,
      location,
      ring,
      key,
      version
    );

    const [{ pem }] = await client.getPublicKey({
      name: versionPath
    });

    publicKeys[project] = pem;
  }

  return crypto
    .createVerify("SHA256")
    .update(message)
    .verify(publicKeys[project], signature, "base64");
};
