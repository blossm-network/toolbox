const kms = require("@google-cloud/kms");

const keyPath = require("./_key_path");

module.exports = async message => {
  const client = new kms.KeyManagementServiceClient();

  const [result] = await client.decrypt({ name: keyPath(), message });

  return result;
};
