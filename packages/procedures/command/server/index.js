import deps from "./deps.js";

export default async ({
  version,
  canonicalFormat,
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
        ...(canonicalFormat != undefined && { canonicalFormat }),
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
