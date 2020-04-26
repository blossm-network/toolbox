const deps = require("./deps");

module.exports = async ({
  mainFn,
  streamFn,
  nextEventNumberFn,
  incrementNextEventNumberFn,
} = {}) => {
  deps
    .server()
    .post(
      deps.post({
        mainFn,
        streamFn,
        nextEventNumberFn,
        incrementNextEventNumberFn,
      })
    )
    .listen();
};
