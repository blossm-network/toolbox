import deps from "./deps.js";

export default async ({
  version,
  mainFn,
  validateFn,
  normalizeFn,
  commandFn,
  aggregateFn,
  queryAggregatesFn,
  readFactFn,
  streamFactFn,
  addFn,
  fillFn,
  countFn,
  contexts,
} = {}) =>
  deps
    .server()
    .post(
      deps.post({
        version,
        mainFn,
        aggregateFn,
        commandFn,
        queryAggregatesFn,
        readFactFn,
        streamFactFn,
        addFn,
        ...(fillFn && { fillFn }),
        ...(validateFn && { validateFn }),
        ...(normalizeFn && { normalizeFn }),
        ...(countFn && { countFn }),
        ...(contexts && { contexts }),
      })
    )
    .listen();
