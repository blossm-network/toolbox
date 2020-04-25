const deps = require("./deps");

module.exports = async ({
  aggregateFn,
  saveEventsFn,
  queryFn,
  streamFn,
  reserveRootCountsFn,
  publishFn,
} = {}) => {
  deps
    .server()
    .get(deps.get({ aggregateFn, queryFn }), { path: "/:root?" })
    .get(deps.stream({ streamFn, ...(queryFn && { queryFn }) }), {
      path: "/stream/:root?",
    })
    .post(
      deps.post({
        saveEventsFn,
        reserveRootCountsFn,
        publishFn,
      })
    )
    .listen();
};
