import deps from "./deps.js";

export default async ({
  saveEventsFn,
  reserveRootCountsFn,
  publishPendingFn,
  rootStreamFn,
  createTransactionFn,
  idempotencyConflictCheckFn,
  saveSnapshotFn,
  countFn,
  saveBlockFn,
  latestBlockFn,
  encryptFn,
  createBlockFn,
  signFn,
  blockPublisherPublicKeyFn,
  findSnapshotsFn,
  findEventsFn,
  findOneSnapshotFn,
  eventStreamFn,
  handlers,
  isPublic,
} = {}) => {
  if (process.env.NODE_ENV != "local") {
    if (typeof publishPendingFn != "function")
      throw deps.internalServerError.message(
        "Event stores require durable publication."
      );

    try {
      await publishPendingFn();
    } catch (error) {
      deps.logger.error(
        "Startup publication recovery failed; pending work remains for retry.",
        {
          name: error?.name,
          code: error?.code,
        }
      );
    }
  }

  deps
    .server()
    .get(
      deps.aggregateStream({
        rootStreamFn,
        findOneSnapshotFn,
        eventStreamFn,
        handlers,
      }),
      {
        path: "/stream-aggregates",
      }
    )
    .get(deps.count({ countFn }), {
      path: "/count/:root",
    })
    .get(deps.rootStream({ rootStreamFn }), {
      path: "/roots",
    })
    .get(
      deps.get({
        findSnapshotsFn,
        findEventsFn,
        findOneSnapshotFn,
        eventStreamFn,
        handlers,
      }),
      { path: "/:root?" }
    )
    .post(
      deps.createBlock({
        saveSnapshotFn,
        rootStreamFn,
        createTransactionFn,
        saveBlockFn,
        latestBlockFn,
        encryptFn,
        createBlockFn,
        signFn,
        blockPublisherPublicKeyFn,
        findOneSnapshotFn,
        eventStreamFn,
        handlers,
        isPublic,
        publishPendingFn,
      }),
      { path: "/create-block" }
    )
    .post(
      deps.post({
        saveEventsFn,
        reserveRootCountsFn,
        publishPendingFn,
        createTransactionFn,
        idempotencyConflictCheckFn,
        findOneSnapshotFn,
        eventStreamFn,
        handlers,
      })
    )
    .listen();
};
