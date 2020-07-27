const deps = require("./deps");

module.exports = async ({
  saveEventsFn,
  aggregateStreamFn,
  reserveRootCountsFn,
  publishFn,
  rootStreamFn,
  createTransactionFn,
  idempotencyConflictCheckFn,
  saveSnapshotFn,
  countFn,
  saveBlockFn,
  latestBlockFn,
  encryptFn,
  signFn,
  blockPublisherPublicKeyFn,
  findSnapshotsFn,
  findEventsFn,
  findOneSnapshotFn,
  eventStreamFn,
  handlers,
  public,
} = {}) => {
  deps
    .server()
    .get(deps.aggregateStream({ aggregateStreamFn }), {
      path: "/stream-aggregates",
    })
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
        signFn,
        blockPublisherPublicKeyFn,
        public,
      }),
      { path: "/create-block" }
    )
    .post(
      deps.post({
        saveEventsFn,
        reserveRootCountsFn,
        publishFn,
        createTransactionFn,
        idempotencyConflictCheckFn,
        findOneSnapshotFn,
        eventStreamFn,
        handlers,
      })
    )
    .listen();
};
