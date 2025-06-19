import deps from "./deps.js";

export default async ({
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
