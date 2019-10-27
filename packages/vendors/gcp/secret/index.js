const deps = require("./deps");

module.exports = async name => {
  const file = `${name}.txt.encrypted`;
  await deps.download({ bucket: process.env.GCP_SECRET_BUCKET, file });
  const encrypted = await deps.readFile(file);
  const [secret] = await Promise.all([
    deps.decrypt({
      message: encrypted,
      ring: process.env.GCP_KMS_SECRET_BUCKET_KEY_RING,
      key: name,
      location: process.env.GCP_KMS_SECRET_BUCKET_KEY_LOCATION,
      project: process.env.GCP_PROJECT
    }),
    deps.unlink(file)
  ]);

  return secret;
};
