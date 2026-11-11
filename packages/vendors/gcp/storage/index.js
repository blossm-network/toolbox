import deps from "./deps.js";

const __client = new deps.Storage();

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
    const { dir, name, ext } = deps.parse(destination);
    let counter = 0;
    for (const file of files) {
      await file.download({
        destination: deps.join(
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
