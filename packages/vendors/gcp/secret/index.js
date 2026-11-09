import deps from "./deps.js";

const createKeyIfNeeded = async ({ key, project, ring, location }) => {
  try {
    await deps.createKey({ id: key, project, ring, location });
  } catch (err) {
    if (err.code !== 6) throw err;
  }
};

const withEncryptedFile = async (fn) => {
  const filename = `${deps.uuid()}.txt.encrypted`;
  let result;
  let failure;
  try {
    result = await fn(filename);
  } catch (err) {
    failure = err;
  }
  try {
    await deps.unlink(filename);
  } catch (err) {
    if (!failure && err.code !== "ENOENT") throw err;
  }
  if (failure) throw failure;
  return result;
};

const get = async (
  key,
  {
    project = process.env.GCP_PROJECT,
    ring = process.env.GCP_KMS_SECRET_BUCKET_KEY_RING,
    location = process.env.GCP_KMS_SECRET_BUCKET_KEY_LOCATION,
    bucket = process.env.GCP_SECRET_BUCKET,
  } = {}
) =>
  withEncryptedFile(async (filename) => {
    await deps.download({
      bucket,
      file: `${key}.txt.encrypted`,
      destination: filename,
    });
    const encrypted = await deps.readFile(filename);
    return deps.decrypt({
      message: encrypted.toString().trim(),
      ring,
      key,
      location,
      project,
    });
  });

const create = async (
  key,
  message,
  {
    project = process.env.GCP_PROJECT,
    ring = process.env.GCP_KMS_SECRET_BUCKET_KEY_RING,
    location = process.env.GCP_KMS_SECRET_BUCKET_KEY_LOCATION,
    bucket = process.env.GCP_SECRET_BUCKET,
  } = {}
) => {
  await createKeyIfNeeded({ key, project, ring, location });
  const ciphertext = await deps.encrypt({
    message,
    key,
    ring,
    location,
    project,
  });
  await withEncryptedFile(async (filename) => {
    await deps.writeFile(filename, ciphertext);
    await deps.upload({
      file: filename,
      bucket,
      destination: `${key}.txt.encrypted`,
    });
  });
};

export default { get, create };
