import deps from "./deps.js";

export default async ({
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
