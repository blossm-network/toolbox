const deps = require("./deps");

module.exports = async ({
  mainFn,
  aggregateStreamFn,
  aggregateFn,
  readFactFn,
} = {}) => {
  deps
    .server()
    .post(
      deps.post({
        mainFn,
        aggregateStreamFn,
        aggregateFn,
        readFactFn,
      })
    )
    .listen();
};
