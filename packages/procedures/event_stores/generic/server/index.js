const deps = require("./deps");

module.exports = async ({
  aggregateFn,
  saveEventsFn,
  queryFn,
  publishFn
} = {}) => {
  deps
    .server()
    .get(deps.get({ aggregateFn, queryFn }), { path: "/:root?" })
    .post(
      deps.post({
        saveEventsFn,
        aggregateFn,
        publishFn
      })
    )
    .listen();
};
