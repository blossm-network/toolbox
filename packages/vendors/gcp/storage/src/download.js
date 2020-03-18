const deps = require("../deps");

module.exports = async ({ bucket: bucketName, destination, file }) => {
  const storage = new deps.storage();

  const bucket = storage.bucket(bucketName);

  if (file) {
    await bucket.file(file).download({
      destination
    });
  } else {
    const [files] = await bucket.getFiles();
    let counter = 0;
    for (const file of files) {
      const lastDotIndex = destination.lastIndexOf(".");
      const fileName = destination.slice(0, lastDotIndex);
      const fileExtension = destination.slice(lastDotIndex + 1);
      await file.download({
        destination: `${fileName}${
          counter == 0 ? "" : `_${counter}`
        }.${fileExtension}`
      });
      counter++;
    }
  }
};
