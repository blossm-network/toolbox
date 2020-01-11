const deps = require("./deps");

module.exports = async ({ aggregateFn, createEventFn, publishFn } = {}) => {
  deps
    .server()
    .get(deps.get({ aggregateFn }), { path: "/:root" })
    .post(
      deps.post({
        createEventFn,
        aggregateFn,
        publishFn
      })
    )
    .listen();
};
