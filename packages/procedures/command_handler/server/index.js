const deps = require("./deps");

module.exports = async ({
  version,
  mainFn,
  validateFn,
  normalizeFn,
  aggregateFn,
  addFn,
  fillFn
} = {}) =>
  deps
    .server()
    .post(
      deps.post({
        version,
        mainFn,
        aggregateFn,
        addFn,
        ...(fillFn && { fillFn }),
        ...(validateFn && { validateFn }),
        ...(normalizeFn && { normalizeFn })
      })
    )
    .listen();
