const deps = require("./deps");

module.exports = async ({
  replayStores,
  mainFn,
  rootStreamFn,
  playFn,
  aggregateFn,
  readFactFn,
} = {}) => {
  deps
    .server()
    .post(
      deps.replay({
        replayStores,
        playFn,
        rootStreamFn,
      }),
      { path: "/replay" }
    )
    .post(
      deps.play({
        mainFn,
        aggregateFn,
        readFactFn,
      })
    )
    .listen();
};
