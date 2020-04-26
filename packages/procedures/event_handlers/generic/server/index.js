const deps = require("./deps");

module.exports = async ({
  mainFn,
  commitFn,
  streamFn,
  nextEventNumberFn,
  saveNextEventNumberFn,
} = {}) => {
  deps
    .server()
    .post(
      deps.post({
        mainFn,
        commitFn,
        streamFn,
        nextEventNumberFn,
        saveNextEventNumberFn,
      })
    )
    .listen();
};
