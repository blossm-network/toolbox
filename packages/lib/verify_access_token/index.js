import crypto from "crypto";
import deps from "./deps.js";

let publicKey;

export default ({ url, algorithm = "SHA256" }) => async ({
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
