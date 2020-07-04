const deps = require("./deps");

module.exports = async ({
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
      })
    )
    .listen();
