import deps from "./deps.js";

export default async ({
  connection,
  namespace = "public",
  indexes = [],
  handlers,
  publishFn,
  encryptFn,
  createBlockFn,
  signFn,
  blockPublisherPublicKeyFn,
  isPublic,
} = {}) => {
  const database = deps.db.connect(connection);

  try {
    const { eventStore, snapshotStore, countsStore, blockchainStore } =
      await deps.stores({ database, namespace, indexes });

    return await deps.eventStore({
      findSnapshotsFn: deps.findSnapshots({ snapshotStore }),
      findEventsFn: deps.findEvents({ eventStore }),
      findOneSnapshotFn: deps.findOneSnapshot({ snapshotStore }),
      eventStreamFn: deps.eventStream({ eventStore }),
      handlers,
      saveEventsFn: deps.saveEvents({ eventStore, handlers }),
      reserveRootCountsFn: deps.reserveRootCounts({ countsStore }),
      rootStreamFn: deps.rootStream({ countsStore }),
      countFn: deps.count({ countsStore }),
      idempotencyConflictCheckFn: deps.idempotencyConflictCheck({ eventStore }),
      createTransactionFn: deps.createTransaction({ database }),
      saveSnapshotFn: deps.saveSnapshot({ snapshotStore }),
      saveBlockFn: deps.saveBlock({ blockchainStore }),
      latestBlockFn: deps.latestBlock({ blockchainStore }),
      publishFn,
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
