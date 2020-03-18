const deps = require("./deps");

const createKeyIfNeeded = async ({ key, project, ring, location }) => {
  try {
    await deps.createKey({
      id: key,
      project,
      ring,
      location
    });
  } catch (e) {
    return;
  }
};

exports.get = async (
  key,
  {
    project = process.env.GCP_PROJECT,
    ring = process.env.GCP_KMS_SECRET_BUCKET_KEY_RING,
    location = process.env.GCP_KMS_SECRET_BUCKET_KEY_LOCATION,
    bucket = process.env.GCP_SECRET_BUCKET
  } = {}
) => {
  const file = `${key}.txt.encrypted`;
  const fileName = `${deps.uuid()}.txt.encrypted`;
  await deps.download({ bucket, file, destination: fileName });
  const encrypted = await deps.readFile(fileName);
  const [secret] = await Promise.all([
    deps.decrypt({
      message: encrypted.toString().trim(),
      ring,
      key,
      location,
      project
    }),
    deps.unlink(file)
  ]);

  return secret;
};

exports.create = async (
  key,
  message,
  {
    project = process.env.GCP_PROJECT,
    ring = process.env.GCP_KMS_SECRET_BUCKET_KEY_RING,
    location = process.env.GCP_KMS_SECRET_BUCKET_KEY_LOCATION,
    bucket = process.env.GCP_SECRET_BUCKET
  } = {}
) => {
  await createKeyIfNeeded({
    key,
    project,
    ring,
    location
  });

  const ciphertext = await deps.encrypt({
    message,
    key,
    ring,
    location,
    project
  });

  const filename = `${key}.txt.encrypted`;
  await deps.writeFile(filename, ciphertext);
  await deps.upload({
    file: filename,
    bucket
  });

  await deps.unlink(filename);
};
