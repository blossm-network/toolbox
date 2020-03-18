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
    //TODO
    //eslint-disable-next-line
    console.log({ fileCount: files.length });
    for (const file of files) {
      //TODO
      //eslint-disable-next-line
      console.log({ file });

      await file.download({
        destination: `${destination}${counter == 0 ? "" : `_${counter}`}`
      });
      counter++;
    }
  }
};
