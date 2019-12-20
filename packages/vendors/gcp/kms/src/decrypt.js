const kms = require("@google-cloud/kms");

module.exports = async ({ message, key, ring, location, project }) => {
  const client = new kms.KeyManagementServiceClient();
  const name = client.cryptoKeyPath(project, location, ring, key);
  //eslint-disable-next-line
  console.log("sure: ", {
    message,
    key,
    ring,
    location,
    project,
    name,
    env: process.env
  });
  const [result] = await client.decrypt({ name, ciphertext: message });
  return result.plaintext.toString().trim();
};
