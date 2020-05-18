const deps = require("./deps");

module.exports = async ({
  aggregateFn,
  saveEventsFn,
  queryFn,
  streamFn,
  reserveRootCountsFn,
  publishFn,
  rootStreamFn,
} = {}) => {
  deps
    .server()
    .get(deps.rootStream({ rootStreamFn }), {
      path: "/roots",
    })
    .get(deps.stream({ streamFn }), {
      path: "/stream/:root?",
    })
    .get(deps.get({ aggregateFn, queryFn }), { path: "/:root?" })
    .post(
      deps.post({
        saveEventsFn,
        reserveRootCountsFn,
        publishFn,
      })
    )
    .listen();
};
