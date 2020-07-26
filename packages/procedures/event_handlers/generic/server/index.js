const deps = require("./deps");

module.exports = async ({ mainFn, aggregateStreamFn } = {}) => {
  deps
    .server()
    .post(
      deps.post({
        mainFn,
        aggregateStreamFn,
      })
    )
    .listen();
};
