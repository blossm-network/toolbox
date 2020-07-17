const deps = require("./deps");

module.exports = async ({ mainFn, commitFn, streamFn } = {}) => {
  deps
    .server()
    .post(
      deps.post({
        mainFn,
        commitFn,
        streamFn,
      })
    )
    .listen();
};
