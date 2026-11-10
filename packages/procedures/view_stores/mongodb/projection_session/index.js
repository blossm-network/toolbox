import deps from "./deps.js";

const limits = {
  maxOperations: 100,
  maxBytes: 65536,
  leaseMilliseconds: 30000,
  maxPlayMilliseconds: 300000,
};
const maxNotificationBytes = 1048576;
const size = (value) => Buffer.byteLength(JSON.stringify(value));

// ponytail: one lease serializes unrelated roots; partition only when measured contention justifies separate fences.
// One destination-wide lease covers all source/fact reads. The fenced commit
// publishes every view mutation and its retry receipt in the same transaction.
export default async ({
  store,
  writeFn,
  removeFn,
  formatFn = ({ body }) => body,
  updateFn,
  updateKeys,
  queryFn = (query) => query,
  now = () => new Date(),
}) => {
  const database = store.db.db;
  const control = database.collection("projection_control");
  const receipts = database.collection("projection_receipts");
  for (const name of ["projection_control", "projection_receipts"])
    try {
      await database.createCollection(name);
    } catch (error) {
      if (error.code !== 48) throw error;
    }
  await control.updateOne(
    { _id: "destination" },
    { $setOnInsert: { generation: 0, owner: null, expiresAt: new Date(0) } },
    { upsert: true, writeConcern: { w: "majority" } },
  );

  const leaseQuery = ({ playId, owner, generation }) => ({
    _id: "destination",
    owner,
    generation,
    playId,
    expiresAt: { $gt: now() },
  });
  const validateId = (playId) => {
    if (typeof playId !== "string" || playId.length < 1 || playId.length > 1024)
      throw deps.badRequestError.message(
        "A stable projection play ID is required.",
      );
  };
  const begin = async ({ playId }) => {
    validateId(playId);
    const receipt = await receipts.findOne(
      { _id: playId },
      { readConcern: { level: "majority" } },
    );
    if (receipt) return { complete: true, results: [] };
    const owner = deps.uuid();
    const lease = await control.findOneAndUpdate(
      { _id: "destination", expiresAt: { $lte: now() } },
      {
        $inc: { generation: 1 },
        $set: {
          owner,
          playId,
          expiresAt: new Date(now().getTime() + limits.leaseMilliseconds),
        },
      },
      {
        returnDocument: "after",
        includeResultMetadata: false,
        writeConcern: { w: "majority" },
      },
    );
    if (!lease)
      throw deps.conflictError.message("This projection destination is busy.");
    return { playId, owner, generation: lease.generation, limits };
  };
  const renew = async (lease) => {
    const result = await control.updateOne(
      leaseQuery(lease),
      {
        $set: {
          expiresAt: new Date(now().getTime() + limits.leaseMilliseconds),
        },
      },
      { writeConcern: { w: "majority" } },
    );
    if (!result.matchedCount)
      throw deps.conflictError.message("This projection lease has expired.");
    return {};
  };
  const release = async ({ owner, generation }) => {
    await control.updateOne(
      { _id: "destination", owner, generation },
      { $set: { owner: null, expiresAt: new Date(0) } },
      { writeConcern: { w: "majority" } },
    );
    return {};
  };
  const commit = async ({ playId, owner, generation, operations }) => {
    validateId(playId);
    if (
      !Array.isArray(operations) ||
      operations.length > limits.maxOperations ||
      size(operations) > limits.maxBytes ||
      operations.some((operation) => {
        if (
          !operation ||
          !["put", "delete", "put-query", "delete-query"].includes(
            operation.type,
          )
        )
          return true;
        const querying = operation.type.endsWith("-query");
        if (
          querying
            ? !operation.query ||
              typeof operation.query !== "object" ||
              Object.keys(operation.query).length === 0
            : typeof operation.id !== "string" || !operation.id
        )
          return true;
        const writing = operation.type.startsWith("put");
        if (
          writing &&
          (!operation.body ||
            !operation.body.update ||
            typeof operation.body.update !== "object" ||
            Array.isArray(operation.body.update))
        )
          return true;
        const context = writing ? operation.body.context : operation.context;
        return !!(
          process.env.CONTEXT &&
          (!context || !context[process.env.CONTEXT])
        );
      })
    )
      throw deps.badRequestError.message(
        "Invalid or oversized projection batch.",
      );

    const session = await store.db.startSession();
    let results;
    let cleanupFailed = false;
    let cleanupError;
    try {
      await session.withTransaction(
        async () => {
          const receipt = await receipts.findOne({ _id: playId }, { session });
          if (receipt) {
            results = [];
            return;
          }
          const fenced = await control.updateOne(
            leaseQuery({ playId, owner, generation }),
            {
              $set: { lastCommit: now(), lastCommittedGeneration: generation },
            },
            { session },
          );
          if (!fenced.matchedCount)
            throw deps.conflictError.message(
              "This projection lease has expired.",
            );
          const write = deps.viewWrite({
            writeFn: (params) => writeFn({ ...params, session }),
            formatFn,
            ...(updateFn && { updateFn }),
            ...(updateKeys && { updateKeys }),
          });
          const remove = deps.viewRemove({
            removeFn: (query) => removeFn(query, session),
          });
          results = [];
          let mutations = 0;
          for (const operation of operations) {
            const writing = operation.type.startsWith("put");
            const ids = operation.type.endsWith("-query")
              ? (
                  await store.find(
                    deps.queryForIds({
                      query: queryFn(operation.query),
                      context: writing
                        ? operation.body.context
                        : operation.context,
                    }),
                    { "headers.id": 1, _id: 0 },
                    {
                      session,
                      lean: true,
                      limit: limits.maxOperations - mutations + 1,
                    },
                  )
                ).map((view) => view.headers.id)
              : [operation.id];
            mutations += ids.length;
            if (mutations > limits.maxOperations)
              throw deps.badRequestError.message(
                "Projection query exceeds the destination batch limit.",
              );
            for (const id of ids) {
              const result = writing
                ? await write({ id, body: operation.body })
                : await remove({ ...operation, id });
              if (operation.push && result)
                results.push({ type: writing ? "put" : "delete", result });
            }
          }
          if (size(results) > maxNotificationBytes)
            throw deps.badRequestError.message(
              "Projection notification receipt is too large.",
            );
          await receipts.insertOne(
            { _id: playId, generation, created: now() },
            { session },
          );
          await control.updateOne(
            { _id: "destination", owner, generation },
            { $set: { owner: null, expiresAt: new Date(0) } },
            { session },
          );
        },
        {
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
          readPreference: "primary",
        },
      );
    } finally {
      try {
        await session.endSession();
      } catch (error) {
        cleanupFailed = true;
        cleanupError = error;
      }
    }
    if (cleanupFailed) throw cleanupError;
    return { complete: true, generation, results };
  };
  const notification = async ({ generation, id }) => {
    const current = await control.findOne(
      { _id: "destination", lastCommittedGeneration: generation },
      { readConcern: { level: "majority" } },
    );
    if (!current) return {};
    const view = await store.findOne({ "headers.id": id }, null, {
      lean: true,
      readConcern: { level: "majority" },
    });
    return view ? deps.formatView({ formatFn, updateKeys }, view) : {};
  };
  const methods = { begin, renew, commit, release, notification };
  const handle = async (req, res) => {
    const { action, ...params } = req.body;
    if (!Object.prototype.hasOwnProperty.call(methods, action))
      throw deps.badRequestError.message(
        "Unknown projection session operation.",
      );
    res.status(200).send(await methods[action](params));
  };
  return { ...methods, handle };
};
