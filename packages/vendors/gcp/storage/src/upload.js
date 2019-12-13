const deps = require("../deps");

module.exports = async ({ bucket, file }) => {
  const storage = new deps.storage();

  const options = {
    destination: file
  };

  await storage.bucket(bucket).upload(file, options);
};
