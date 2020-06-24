const deps = require("./deps");

module.exports = async ({ mainFn } = {}) =>
  deps
    .server()
    .get(deps.stream({ mainFn }), {
      path: "/stream/:root?",
    })
    .get(deps.get({ mainFn }), { path: "/:root?" })
    .listen();
