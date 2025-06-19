import { Storage } from "@google-cloud/storage";

export const __client = new Storage();

export const upload = async ({ bucket, file, destination }) => {
  const options = {
    destination: destination || file,
  };

  await __client.bucket(bucket).upload(file, options);
};

export const download = async ({ bucket: bucketName, destination, file }) => {
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
