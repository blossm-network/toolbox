import deps from "./deps.js";

export default ({ publicationsStore, publishFn, batchSize = 100 }) => {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1)
    throw new RangeError("batchSize must be a positive safe integer.");

  return async () => {
    const pending = await deps.db.find({
      store: publicationsStore,
      query: {},
      sort: { attempts: 1, created: 1, hash: 1 },
      limit: batchSize,
      options: { lean: true },
    });
    let failure;
    for (const publication of pending) {
      try {
        await publishFn(publication.data, publication.topic);
        await deps.db.remove({
          store: publicationsStore,
          query: { hash: publication.hash },
        });
      } catch (err) {
        if (!failure) failure = err;
        try {
          await deps.db.write({
            store: publicationsStore,
            query: { hash: publication.hash },
            update: { $inc: { attempts: 1 } },
            options: { upsert: false },
          });
        } catch {
          // Keep the publication error and still attempt the rest of this batch.
        }
      }
    }
    if (failure) throw failure;
  };
};
