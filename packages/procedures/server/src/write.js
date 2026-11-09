export default async (res, data) => {
  if (res.destroyed || res.writableEnded)
    throw new Error("The HTTP response is closed.");
  const chunk =
    typeof data === "object" && !Buffer.isBuffer(data) && data !== null
      ? JSON.stringify(data)
      : data;
  if (res.write(chunk) !== false) return;
  await new Promise((resolve, reject) => {
    const cleanup = () => {
      res.removeListener("drain", drained);
      res.removeListener("close", closed);
      res.removeListener("error", failed);
    };
    const drained = () => {
      cleanup();
      resolve();
    };
    const failed = (error) => {
      cleanup();
      reject(error);
    };
    const closed = () =>
      failed(new Error("The HTTP response closed before it drained."));
    res.once("drain", drained);
    res.once("close", closed);
    res.once("error", failed);
  });
};
