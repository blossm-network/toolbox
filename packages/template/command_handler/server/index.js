const deps = require("./deps");

module.exports = async ({ version, mainFn, validateFn, cleanFn } = {}) => {
  deps
    .server()
    .post(
      deps.post({
        version,
        mainFn,
        ...(validateFn && { validateFn }),
        ...(cleanFn && { cleanFn })
      })
    )
    .listen();
};
