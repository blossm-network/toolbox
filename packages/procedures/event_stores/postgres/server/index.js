import deps from "./deps.js";

export default async ({
  connection,
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

    return await deps.eventStore({
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
      rootStreamFn: deps.rootStream({ countsStore }),
      countFn: deps.count({ countsStore }),
      idempotencyConflictCheckFn: deps.idempotencyConflictCheck({ eventStore }),
      createTransactionFn: deps.createTransaction({ database }),
      saveSnapshotFn: deps.saveSnapshot({ snapshotStore }),
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
  } catch (err) {
    await database.end();
    throw err;
  }
};
