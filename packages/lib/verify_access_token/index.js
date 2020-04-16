const crypto = require("crypto");
const deps = require("./deps");

let publicKey;

module.exports = ({ url, algorithm = "SHA256" }) => async ({
  message,
  signature,
}) => {
  if (!publicKey) {
    const response = await deps.get(url);
    const { key } = JSON.parse(response.body);
    publicKey = key;
  }

  return crypto
    .createVerify(algorithm)
    .update(message)
    .verify(publicKey, signature, "base64");
};
