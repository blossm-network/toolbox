const kms = require("@google-cloud/kms");
const crypto = require("crypto");

module.exports = ({
  key,
  ring,
  location,
  version,
  project
}) => async message => {
  const client = new kms.KeyManagementServiceClient();

  //eslint-disable-next-line no-console
  console.log("message to tokenify: ", message);

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

  //eslint-disable-next-line no-console
  console.log("toke is : ", signature.toString("base64"));

  return signature.toString("base64");
};
