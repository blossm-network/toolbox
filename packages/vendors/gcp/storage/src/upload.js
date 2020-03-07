const deps = require("../deps");

module.exports = async ({ bucket, file, destination }) => {
  const storage = new deps.storage();

  const options = {
    destination: destination || file
  };

  await storage.bucket(bucket).upload(file, options);
};
