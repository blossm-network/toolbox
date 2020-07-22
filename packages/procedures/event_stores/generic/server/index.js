const deps = require("./deps");

module.exports = async ({
  aggregateFn,
  saveEventsFn,
  queryFn,
  streamFn,
  reserveRootCountsFn,
  publishFn,
  hashFn,
  rootStreamFn,
  createTransactionFn,
  idempotencyConflictCheckFn,
  saveSnapshotFn,
  countFn,
  saveBlockFn,
  latestBlockFn,
  public,
} = {}) => {
  deps
    .server()
    .get(deps.stream({ streamFn }), {
      path: "/stream/:root?",
    })
    .get(deps.count({ countFn }), {
      path: "/count/:root",
    })
    .get(deps.rootStream({ rootStreamFn }), {
      path: "/roots",
    })
    .get(deps.get({ aggregateFn, queryFn }), { path: "/:root?" })
    .post(
      deps.createBlock({
        saveSnapshotFn,
        aggregateFn,
        rootStreamFn,
        hashFn,
        createTransactionFn,
        saveBlockFn,
        latestBlockFn,
        public,
      }),
      { path: "/create-block" }
    )
    .post(
      deps.post({
        saveEventsFn,
        reserveRootCountsFn,
        publishFn,
        hashFn,
        createTransactionFn,
        idempotencyConflictCheckFn,
      })
    )
    .listen();
};
