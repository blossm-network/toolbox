const crypto = require("crypto");
const deps = require("./deps");

let publicKey;

module.exports = ({ url, algorithm = "SHA256" }) => async ({
  message,
  signature
}) => {
  if (!publicKey) {
    publicKey = await deps.get(url);
  }

  return crypto
    .createVerify(algorithm)
    .update(message)
    .verify(publicKey, signature, "base64");
};
