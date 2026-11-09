export default ({ store, key, deliverFn, db, batchSize = 100 }) => {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1)
    throw new RangeError("batchSize must be a positive safe integer.");

  return async () => {
    const pending = await db.find({
      store,
      query: {},
      sort: { attempts: 1, created: 1, [key]: 1 },
      limit: batchSize,
      options: { lean: true },
    });
    let failure;
    for (const entry of pending) {
      try {
        await deliverFn(entry);
        await db.remove({
          store,
          query: { [key]: entry[key] },
        });
      } catch (err) {
        if (!failure) failure = err;
        try {
          await db.write({
            store,
            query: { [key]: entry[key] },
            update: { $inc: { attempts: 1 } },
            options: { upsert: false },
          });
        } catch {
          // Keep the delivery error and still attempt the rest of this batch.
        }
      }
    }
    if (failure) throw failure;
  };
};
