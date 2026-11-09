import deps from "./deps.js";

const publicKeys = {};

let client;
// Construct on use: recent compatible SDKs start credential discovery in the constructor.
const getClient = () => (client ||= new deps.Client());

const createKey = async ({ id, ring, project, location }) => {
  const parent = getClient().keyRingPath(project, location, ring);
  await getClient().createCryptoKey({
    parent,
    cryptoKeyId: id,
    cryptoKey: {
      purpose: "ENCRYPT_DECRYPT",
    },
  });
};

const decrypt = async ({ message, key, ring, location, project }) => {
  const name = getClient().cryptoKeyPath(project, location, ring, key);
  const [result] = await getClient().decrypt({
    name,
    ciphertext: Buffer.from(message, "base64"),
  });
  return result.plaintext.toString().trim();
};

const encrypt = async ({
  message,
  key,
  ring,
  location,
  project,
  format = "base64",
}) => {
  const name = getClient().cryptoKeyPath(project, location, ring, key);
  const [result] = await getClient().encrypt({
    name,
    plaintext: Buffer.from(message),
  });
  return result.ciphertext.toString(format).trim();
};

const publicKey = async ({ key, ring, location, version, project }) => {
  const versionPath = getClient().cryptoKeyVersionPath(
    project,
    location,
    ring,
    key,
    version
  );

  const [{ pem }] = await getClient().getPublicKey({
    name: versionPath,
  });

  return pem;
};

const sign = async ({
  message,
  format = "base64",
  key,
  ring,
  location,
  version,
  project,
}) => {
  const digest = deps.crypto.createHash("SHA256").update(message).digest();

  const versionPath = getClient().cryptoKeyVersionPath(
    project,
    location,
    ring,
    key,
    version
  );

  const [{ signature }] = await getClient().asymmetricSign({
    name: versionPath,
    digest: { sha256: digest },
  });

  return signature.toString(format);
};

const verify = ({ key, ring, location, version, project }) => async ({
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

export default {
  get __client() {
    return getClient();
  },
  createKey,
  decrypt,
  encrypt,
  publicKey,
  sign,
  verify,
};