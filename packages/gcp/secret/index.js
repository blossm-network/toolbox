const deps = require("./deps");
const logger = require("@sustainers/logger");

module.exports = async name => {
  logger.info("CHECKPOINT inSecret");
  const file = `${name}.txt.encrypted`;
  logger.info("CHECKPOINT looking for file: ", { file });
  await deps.download({ bucket: process.env.GCP_SECRET_BUCKET, file });
  logger.info("CHECKPOINT file downloaded: ");
  const encrypted = await deps.readFile(file);
  logger.info("CHECKPOINT encrpyted: ", { encrypted });
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

  logger.info("CHECKPOINT secret: ", { secret });
  return secret;
};
