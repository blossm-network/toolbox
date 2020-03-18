const deps = require("../deps");

module.exports = async ({ bucket: bucketName, destination, file }) => {
  const storage = new deps.storage();

  const bucket = storage.bucket(bucketName);

  if (file) {
    await bucket.file(file).download({
      destination
    });
  } else {
    const files = await bucket.getFiles();
    let counter = 0;
    for (const file of files) {
      file.download({
        destination: `${destination}${counter == 0 ? "" : `_${counter}`}`
      });
      counter++;
    }
  }
};
