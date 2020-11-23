const deps = require("./deps");

module.exports = async ({
  replayStores,
  mainFn,
  rootStreamFn,
  playFn,
  aggregateFn,
  readFactFn,
  mutedEvents,
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
        mutedEvents,
      })
    )
    .listen();
};
