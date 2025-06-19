import kms from "@google-cloud/kms";

import deps from "./deps.js";

const publicKeys = {};

export const __client = new kms.KeyManagementServiceClient();

export const createKey = async ({ id, ring, project, location }) => {
  const parent = __client.keyRingPath(project, location, ring);
  await __client.createCryptoKey({
    parent,
    cryptoKeyId: id,
    cryptoKey: {
      purpose: "ENCRYPT_DECRYPT",
    },
  });
};

export const decrypt = async ({ message, key, ring, location, project }) => {
  const name = __client.cryptoKeyPath(project, location, ring, key);
  const [result] = await __client.decrypt({
    name,
    ciphertext: Buffer.from(message, "base64"),
  });
  return result.plaintext.toString().trim();
};

export const encrypt = async ({
  message,
  key,
  ring,
  location,
  project,
  format = "base64",
}) => {
  const name = __client.cryptoKeyPath(project, location, ring, key);
  const [result] = await __client.encrypt({
    name,
    plaintext: Buffer.from(message),
  });
  return result.ciphertext.toString(format).trim();
};

export const publicKey = async ({ key, ring, location, version, project }) => {
  const versionPath = __client.cryptoKeyVersionPath(
    project,
    location,
    ring,
    key,
    version
  );

  const [{ pem }] = await __client.getPublicKey({
    name: versionPath,
  });

  return pem;
};

export const sign = async ({
  message,
  format = "base64",
  key,
  ring,
  location,
  version,
  project,
}) => {
  const digest = deps.crypto.createHash("SHA256").update(message).digest();

  const versionPath = __client.cryptoKeyVersionPath(
    project,
    location,
    ring,
    key,
    version
  );

  const [{ signature }] = await __client.asymmetricSign({
    name: versionPath,
    digest: { sha256: digest },
  });

  return signature.toString(format);
};

export const verify = ({ key, ring, location, version, project }) => async ({
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

  return deps.crypto
    .createVerify("SHA256")
    .update(message)
    .verify(publicKeys[instanceKey], signature, format);
};
