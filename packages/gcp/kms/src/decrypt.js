const kms = require("@google-cloud/kms");
const logger = require("@sustainers/logger");

module.exports = async ({ message, key, ring, location, project }) => {
  const client = new kms.KeyManagementServiceClient();
  const name = client.cryptoKeyPath(project, location, ring, key);
  logger.info("SOME NAME: ", { name });
  const [result] = await client.decrypt({ name, ciphertext: message });
  logger.info("SOME RESULT: ", {
    result,
    plaintext: result.plaintext.data,
    string: result.plaintext.data.toString()
  });
  return result.plaintext.data.toString();
};
