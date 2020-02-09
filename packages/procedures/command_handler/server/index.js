const deps = require("./deps");

module.exports = async ({
  version,
  mainFn,
  validateFn,
  normalizeFn,
  aggregateFn,
  fillFn
} = {}) =>
  deps
    .server()
    .post(
      deps.post({
        version,
        mainFn,
        aggregateFn,
        ...(fillFn && { fillFn }),
        ...(validateFn && { validateFn }),
        ...(normalizeFn && { normalizeFn })
      })
    )
    .listen();
