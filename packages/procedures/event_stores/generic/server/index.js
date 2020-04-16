const deps = require("./deps");

module.exports = async ({
  aggregateFn,
  saveEventsFn,
  queryFn,
  reserveRootCountsFn,
  publishFn,
} = {}) => {
  deps
    .server()
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
