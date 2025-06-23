import { Storage } from "@google-cloud/storage";

const __client = new Storage();

const upload = async ({ bucket, file, destination }) => {
  const options = {
    destination: destination || file,
  };

  await __client.bucket(bucket).upload(file, options);
};

const download = async ({ bucket: bucketName, destination, file }) => {
  const bucket = __client.bucket(bucketName);

  if (file) {
    await bucket.file(file).download({
      destination,
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
        }.${fileExtension}`,
      });
      counter++;
    }
  }
};

export default {
  __client,
  upload,
  download,
};