const deps = require("./deps");

module.exports = async ({
  aggregateFn,
  createEventFn,
  createAggregateFn,
  publishFn
} = {}) => {
  deps
    .server()
    .get(deps.get({ aggregateFn }), { path: "/:root" })
    .post(
      deps.post({
        createEventFn,
        createAggregateFn,
        publishFn
      })
    )
    .listen();
};
