const deps = require("./deps");

module.exports = async ({
  mainFn,
  queryAggregatesFn,
  aggregateFn,
  contexts,
} = {}) =>
  deps
    .server()
    .get(deps.stream({ mainFn, queryAggregatesFn, aggregateFn, contexts }), {
      path: "/stream/:root?",
    })
    .get(deps.get({ mainFn, queryAggregatesFn, aggregateFn, contexts }), {
      path: "/:root?",
    })
    .listen();
