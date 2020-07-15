const deps = require("./deps");

module.exports = async ({
  aggregateFn,
  saveEventsFn,
  queryFn,
  streamFn,
  reserveRootCountsFn,
  publishFn,
  getProofFn,
  updateProofFn,
  hashFn,
  proofsFn,
  saveProofsFn,
  rootStreamFn,
  scheduleUpdateForProofFn,
  createTransactionFn,
  idempotencyConflictCheckFn,
  countFn,
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
    .put(
      deps.updateProof({
        getProofFn,
        updateProofFn,
      }),
      { path: "/proof/:id" }
    )
    .post(
      deps.post({
        saveEventsFn,
        reserveRootCountsFn,
        publishFn,
        hashFn,
        proofsFn,
        saveProofsFn,
        scheduleUpdateForProofFn,
        createTransactionFn,
        idempotencyConflictCheckFn,
      })
    )
    .listen();
};
