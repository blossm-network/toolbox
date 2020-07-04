const deps = require("./deps");

module.exports = async ({
  version,
  mainFn,
  validateFn,
  normalizeFn,
  commandFn,
  aggregateFn,
  queryAggregateFn,
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
        queryAggregateFn,
        readFactFn,
        streamFactFn,
        addFn,
        ...(fillFn && { fillFn }),
        ...(validateFn && { validateFn }),
        ...(normalizeFn && { normalizeFn }),
      })
    )
    .listen();
