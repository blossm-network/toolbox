export default async ({ store, query, fn }) => {
  const cursor = store.find(query).cursor();
  let failed = false;
  try {
    await cursor.eachAsync(fn, { parallel: 1 });
  } catch (err) {
    failed = true;
    throw err;
  } finally {
    try {
      await cursor.close();
    } catch (err) {
      if (!failed) throw err;
    }
  }
};
