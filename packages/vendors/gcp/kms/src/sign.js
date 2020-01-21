const kms = require("@google-cloud/kms");
const crypto = require("crypto");

module.exports = ({
  key,
  ring,
  location,
  version,
  project
}) => async message => {
  //eslint-disable-next-line
  console.log("signing: ", {
    key,
    ring,
    location,
    version,
    project,
    message
  });
  const client = new kms.KeyManagementServiceClient();

  const digest = crypto
    .createHash("SHA256")
    .update(message)
    .digest();

  const versionPath = client.cryptoKeyVersionPath(
    project,
    location,
    ring,
    key,
    version
  );

  const [{ signature }] = await client.asymmetricSign({
    name: versionPath,
    digest: { sha256: digest }
  });

  //eslint-disable-next-line
  console.log("resulting sig: ", signature.toString("base64"));
  return signature.toString("base64");
};
