const deps = require("./deps");

module.exports = async ({
  mainFn,
  queryAggregatesFn,
  aggregateFn,
  readFactFn,
  streamFactFn,
  contexts,
} = {}) =>
  deps
    .server()
    .get(
      deps.stream({
        mainFn,
        queryAggregatesFn,
        aggregateFn,
        contexts,
        readFactFn,
        streamFactFn,
      }),
      {
        path: "/stream/:root?",
      }
    )
    .get(
      deps.get({
        mainFn,
        queryAggregatesFn,
        aggregateFn,
        contexts,
        readFactFn,
        streamFactFn,
      }),
      {
        path: "/:root?",
      }
    )
    .listen();
