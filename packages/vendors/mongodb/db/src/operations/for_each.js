export default async ({ store, query, fn }) => {
  const cursor = store.find(query).cursor();
  let cleanupFailed = false;
  let cleanupError;
  try {
    await cursor.eachAsync(fn, { parallel: 1 });
  } finally {
    try {
      await cursor.close();
    } catch (err) {
      cleanupFailed = true;
      cleanupError = err;
    }
  }
  if (cleanupFailed) throw cleanupError;
};
