const deps = require("./deps");

module.exports = async name => {
  const file = `${name}.txt.encrypted`;
  await deps.download({
    bucket: process.env.GCP_SECRET_BUCKET,
    file
  });

  const encrypted = await deps.readFile(file);
  const [secret] = await Promise.all([
    deps.decrypt(encrypted),
    deps.unlink(file)
  ]);

  return secret;
};
