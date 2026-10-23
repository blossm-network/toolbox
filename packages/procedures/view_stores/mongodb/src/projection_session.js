import { write as viewWrite, formatView } from "@blossm/view-store-put";
import { remove as viewRemove } from "@blossm/view-store-delete";
import { queryForIds } from "@blossm/view-store-id-stream";
import uuid from "@blossm/uuid";
import { badRequest, conflict } from "@blossm/errors";

const limits = {
  maxOperations: 100,
  maxBytes: 65536,
  leaseMilliseconds: 30000,
  maxPlayMilliseconds: 300000,
};
const maxNotificationBytes = 1048576;
const size = (value) => Buffer.byteLength(JSON.stringify(value));

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
  enabled = false,
  prepared = false,
  now = () => new Date(),
}) => {
  await store.db.asPromise();
  const database = store.db.db;
  const control = database.collection("projection_control");
  const receipts = database.collection("projection_receipts");
  if (enabled || prepared) {
    await store.init();
    for (const name of ["projection_control", "projection_receipts"])
      try {
        await database.createCollection(name);
      } catch (error) {
        if (error.code !== 48) throw error;
      }
    await control.updateOne(
      { _id: "destination" },
      {
        $set: { prepared: true, ...(enabled && { enabled: true }) },
        $setOnInsert: { generation: 0, owner: null, expiresAt: new Date(0) },
      },
      { upsert: true, writeConcern: { w: "majority" } }
    );
  }

  const active = async () =>
    enabled ||
    !!(await control.findOne(
      { _id: "destination", enabled: true },
      { readConcern: { level: "majority" } }
    ));
  const requireActive = async () => {
    if (!(await active()))
      throw conflict.message("Projection consistency is not enabled.");
  };
  const legacy = async (fn) => {
    const configuration = await control.findOne(
      { _id: "destination" },
      { readConcern: { level: "majority" } }
    );
    if (configuration && configuration.enabled)
      throw conflict.message(
        "This destination requires a fenced projection session."
      );
    if (!configuration || !configuration.prepared) return fn();
    const session = await store.db.startSession();
    let result;
    try {
      await session.withTransaction(
        async () => {
          const fenced = await control.updateOne(
            { _id: "destination", prepared: true, enabled: { $ne: true } },
            { $inc: { legacyGeneration: 1 } },
            { session }
          );
          if (!fenced.matchedCount)
            throw conflict.message(
              "This destination requires a fenced projection session."
            );
          result = await fn(session);
        },
        {
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
          readPreference: "primary",
        }
      );
      return result;
    } finally {
      await session.endSession();
    }
  };
  const leaseQuery = ({ playId, owner, generation }) => ({
    _id: "destination",
    enabled: true,
    owner,
    generation,
    playId,
    expiresAt: { $gt: now() },
  });
  const validateId = (playId) => {
    if (typeof playId !== "string" || playId.length < 1 || playId.length > 1024)
      throw badRequest.message("A stable projection play ID is required.");
  };
  const begin = async ({ playId }) => {
    await requireActive();
    validateId(playId);
    const receipt = await receipts.findOne(
      { _id: playId },
      { readConcern: { level: "majority" } }
    );
    if (receipt) return { complete: true, results: [] };
    const owner = uuid();
    const lease = await control.findOneAndUpdate(
      { _id: "destination", enabled: true, expiresAt: { $lte: now() } },
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
      }
    );
    if (!lease) throw conflict.message("This projection destination is busy.");
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
      { writeConcern: { w: "majority" } }
    );
    if (!result.matchedCount)
      throw conflict.message("This projection lease has expired.");
    return {};
  };
  const release = async ({ owner, generation }) => {
    await control.updateOne(
      { _id: "destination", owner, generation },
      { $set: { owner: null, expiresAt: new Date(0) } },
      { writeConcern: { w: "majority" } }
    );
    return {};
  };
  const commit = async ({ playId, owner, generation, operations }) => {
    await requireActive();
    validateId(playId);
    if (
      !Array.isArray(operations) ||
      operations.length > limits.maxOperations ||
      size(operations) > limits.maxBytes ||
      operations.some((operation) => {
        if (
          !operation ||
          !["put", "delete", "put-query", "delete-query"].includes(
            operation.type
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
      throw badRequest.message("Invalid or oversized projection batch.");

    const session = await store.db.startSession();
    let results;
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
            { session }
          );
          if (!fenced.matchedCount)
            throw conflict.message("This projection lease has expired.");
          const write = viewWrite({
            writeFn: (params) => writeFn({ ...params, session }),
            formatFn,
            ...(updateFn && { updateFn }),
            ...(updateKeys && { updateKeys }),
          });
          const remove = viewRemove({
            removeFn: (query) => removeFn(query, session),
          });
          results = [];
          let mutations = 0;
          for (const operation of operations) {
            const writing = operation.type.startsWith("put");
            const ids = operation.type.endsWith("-query")
              ? (
                  await store.find(
                    queryForIds({
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
                    }
                  )
                ).map((view) => view.headers.id)
              : [operation.id];
            mutations += ids.length;
            if (mutations > limits.maxOperations)
              throw badRequest.message(
                "Projection query exceeds the destination batch limit."
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
            throw badRequest.message(
              "Projection notification receipt is too large."
            );
          await receipts.insertOne(
            { _id: playId, generation, created: now() },
            { session }
          );
          await control.updateOne(
            { _id: "destination", owner, generation },
            { $set: { owner: null, expiresAt: new Date(0) } },
            { session }
          );
        },
        {
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
          readPreference: "primary",
        }
      );
      return { complete: true, generation, results };
    } finally {
      await session.endSession();
    }
  };
  const notification = async ({ generation, id }) => {
    await requireActive();
    const current = await control.findOne(
      { _id: "destination", lastCommittedGeneration: generation },
      { readConcern: { level: "majority" } }
    );
    if (!current) return {};
    const view = await store.findOne({ "headers.id": id }, null, {
      lean: true,
      readConcern: { level: "majority" },
    });
    return view ? formatView({ formatFn, updateKeys }, view) : {};
  };
  const methods = { begin, renew, commit, release, notification };
  const handle = async (req, res) => {
    const { action, ...params } = req.body;
    if (!Object.prototype.hasOwnProperty.call(methods, action))
      throw badRequest.message("Unknown projection session operation.");
    res.status(200).send(await methods[action](params));
  };
  return { ...methods, handle, legacy };
};
