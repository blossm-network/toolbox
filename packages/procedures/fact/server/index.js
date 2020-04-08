const deps = require("./deps");

module.exports = async ({ mainFn } = {}) =>
  deps
    .server()
    .get(deps.get({ mainFn }), { path: "/:root?" })
    .listen();
