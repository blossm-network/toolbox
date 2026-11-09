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
  if (process.env.NODE_ENV != "local" && typeof publishPendingFn != "function")
    throw deps.internalServerError.message(
      "Event stores require durable publication."
    );

  const recoverPublications = async () => {
    try {
      await publishPendingFn();
    } catch (error) {
      deps.logger.error(
        "Publication recovery failed; pending work remains for retry.",
        {
          name: error?.name,
          code: error?.code,
        }
      );
    }
  };

  if (process.env.NODE_ENV != "local") await recoverPublications();

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
        rootStreamFn,
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
        publishPendingFn: recoverPublications,
      }),
      { path: "/create-block" }
    )
    .post(
      deps.post({
        saveEventsFn,
        reserveRootCountsFn,
        publishPendingFn: recoverPublications,
        createTransactionFn,
        idempotencyConflictCheckFn,
        findOneSnapshotFn,
        eventStreamFn,
        handlers,
      })
    )
    .listen();
};
