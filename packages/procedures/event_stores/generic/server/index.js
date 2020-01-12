const deps = require("./deps");

module.exports = async ({ aggregateFn, saveEventFn, publishFn } = {}) => {
  deps
    .server()
    .get(deps.get({ aggregateFn }), { path: "/:root" })
    .post(
      deps.post({
        saveEventFn,
        aggregateFn,
        publishFn
      })
    )
    .listen();
};
