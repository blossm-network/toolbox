const crypto = require("crypto");
const deps = require("./deps");

let publicKey;

module.exports = ({ url, algorithm = "SHA256" }) => async ({
  message,
  signature
}) => {
  if (!publicKey) {
    const response = await deps.get(url);
    const { key } = response.body;
    publicKey = key;
  }

  //TODO
  //eslint-disable-next-line
  console.log({ publicKey, signature, algorithm, url });

  return crypto
    .createVerify(algorithm)
    .update(message)
    .verify(publicKey, signature, "base64");
};
