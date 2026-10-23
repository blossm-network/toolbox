import { parse, join } from "node:path";
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
    const { dir, name, ext } = parse(destination);
    let counter = 0;
    for (const file of files) {
      await file.download({
        destination: join(
          dir,
          `${name}${counter === 0 ? "" : `_${counter}`}${ext}`
        ),
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
