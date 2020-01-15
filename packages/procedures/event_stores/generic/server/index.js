const deps = require("./deps");

module.exports = async ({
  aggregateFn,
  saveEventFn,
  queryFn,
  publishFn
} = {}) => {
  deps
    .server()
    .get(deps.get({ aggregateFn, queryFn }), { path: "/:root?" })
    .post(
      deps.post({
        saveEventFn,
        aggregateFn,
        publishFn
      })
    )
    .listen();
};
