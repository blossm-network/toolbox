import deps from "./deps.js";
import normalize from "./normalize.js";

export default async ({
  connection,
  schema,
  namespace = "public",
  indexes = [],
  handlers,
  publishFn,
  publicationBatchSize,
  encryptFn,
  createBlockFn,
  signFn,
  blockPublisherPublicKeyFn,
  isPublic,
} = {}) => {
  // Fails closed on an unsupported schema before any connection is opened.
  const { normalizeTransactionFn, normalizePayloadFn, assertStateFn } =
    normalize(schema);
  const database = deps.db.connect(connection);

  try {
    const {
      eventStore,
      snapshotStore,
      countsStore,
      blockchainStore,
      publicationsStore,
    } = await deps.stores({ database, namespace, indexes });

    const pStore =
      process.env.NODE_ENV == "local" ? undefined : publicationsStore;

    const saveSnapshot = deps.saveSnapshot({ snapshotStore });
    await deps.eventStore({
      normalizeTransactionFn,
      ...(normalizePayloadFn && { normalizePayloadFn }),
      findSnapshotsFn: deps.findSnapshots({ snapshotStore }),
      findEventsFn: deps.findEvents({ eventStore }),
      findOneSnapshotFn: deps.findOneSnapshot({ snapshotStore }),
      eventStreamFn: deps.eventStream({ eventStore }),
      handlers,
      saveEventsFn: deps.saveEvents({
        eventStore,
        publicationsStore: pStore,
        handlers,
      }),
      reserveRootCountsFn: deps.reserveRootCounts({ countsStore }),
      rootStreamFn: deps.rootStream({ countsStore, snapshotStore }),
      countFn: deps.count({ countsStore }),
      idempotencyConflictCheckFn: deps.idempotencyConflictCheck({ eventStore }),
      createTransactionFn: deps.createTransaction({ database }),
      saveSnapshotFn: assertStateFn
        ? async (options) => {
            await assertStateFn(options.snapshot.state);
            return saveSnapshot(options);
          }
        : saveSnapshot,
      saveBlockFn: deps.saveBlock({ blockchainStore }),
      latestBlockFn: deps.latestBlock({ blockchainStore }),
      publishPendingFn:
        pStore &&
        deps.publishPending({
          publicationsStore: pStore,
          publishFn,
          batchSize: publicationBatchSize,
        }),
      encryptFn,
      createBlockFn,
      signFn,
      blockPublisherPublicKeyFn,
      isPublic,
    });
    return { close: () => database.end() };
  } catch (err) {
    // Cleanup must not hide the startup failure that caused it.
    try {
      await database.end();
    } catch {
      // Retain the original error.
    }
    throw err;
  }
};
