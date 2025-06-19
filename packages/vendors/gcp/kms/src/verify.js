import crypto from "crypto";

import publicKey from "./public_key.js";

let publicKeys = {};

export default ({ key, ring, location, version, project }) => async ({
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
