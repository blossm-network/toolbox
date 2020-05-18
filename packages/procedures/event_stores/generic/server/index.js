const deps = require("./deps");

module.exports = async ({
  aggregateFn,
  saveEventsFn,
  queryFn,
  streamFn,
  reserveRootCountsFn,
  publishFn,
  // rootStreamFn,
} = {}) => {
  deps
    .server()
    // .get(deps.rootStream({ rootStreamFn }), {
    //   path: "/roots",
    // })
    .get(deps.get({ aggregateFn, queryFn }), { path: "/:root?" })
    .get(deps.stream({ streamFn }), {
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
