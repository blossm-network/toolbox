const deps = require("./deps");

module.exports = async ({ mainFn, queryAggregatesFn, aggregateFn } = {}) =>
  deps
    .server()
    .get(deps.stream({ mainFn, queryAggregatesFn, aggregateFn }), {
      path: "/stream/:root?",
    })
    .get(deps.get({ mainFn, queryAggregatesFn, aggregateFn }), {
      path: "/:root?",
    })
    .listen();
