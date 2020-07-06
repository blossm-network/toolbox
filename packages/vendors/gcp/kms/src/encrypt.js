const kms = require("@google-cloud/kms");

module.exports = async ({
  message,
  key,
  ring,
  location,
  project,
  format = "base64",
}) => {
  const client = new kms.KeyManagementServiceClient();
  const name = client.cryptoKeyPath(project, location, ring, key);
  const [result] = await client.encrypt({
    name,
    plaintext: Buffer.from(message),
  });
  return result.ciphertext.toString(format).trim();
};
