const deps = require("./deps");

module.exports = async ({ version, mainFn, validateFn, normalizeFn } = {}) => {
  deps
    .server()
    .post(
      deps.post({
        version,
        mainFn,
        ...(validateFn && { validateFn }),
        ...(normalizeFn && { normalizeFn })
      })
    )
    .listen();
};
