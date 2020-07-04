const deps = require("./deps");

module.exports = async ({ mainFn, queryAggregatesFn } = {}) =>
  deps
    .server()
    .get(deps.stream({ mainFn, queryAggregatesFn }), {
      path: "/stream/:root?",
    })
    .get(deps.get({ mainFn, queryAggregatesFn }), { path: "/:root?" })
    .listen();
