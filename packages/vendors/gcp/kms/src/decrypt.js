const kms = require("@google-cloud/kms");

module.exports = async ({ message, key, ring, location, project }) => {
  const client = new kms.KeyManagementServiceClient();
  const name = client.cryptoKeyPath(project, location, ring, key);
  const [result] = await client.decrypt({
    name,
    ciphertext: Buffer.from(message, "base64"),
  });
  return result.plaintext.toString().trim();
};
