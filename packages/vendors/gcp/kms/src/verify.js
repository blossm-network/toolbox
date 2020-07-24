const crypto = require("crypto");

const publicKey = require("./public_key");

let publicKeys = {};

module.exports = ({ key, ring, location, version, project }) => async ({
  message,
  signature,
  format = "base64",
}) => {
  const instanceKey = `${project}.${ring}.${key}`;
  if (publicKeys[instanceKey] == undefined) {
    const pem = await publicKey({
      key,
      ring,
      location,
      version,
      project,
    });

    publicKeys[instanceKey] = pem;
  }

  return crypto
    .createVerify("SHA256")
    .update(message)
    .verify(publicKeys[instanceKey], signature, format);
};
