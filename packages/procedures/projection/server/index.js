import deps from "./deps.js";

export default async ({
  replayStores,
  mainFn,
  rootStreamFn,
  playFn,
  aggregateFn,
  readFactFn,
  mutedEvents,
  sessionFn,
} = {}) => {
  deps
    .server()
    .post(
      deps.replay({
        replayStores,
        playFn,
        rootStreamFn,
        ...(sessionFn && { requireReplayId: true }),
      }),
      { path: "/replay" }
    )
    .post(
      deps.play({
        mainFn,
        aggregateFn,
        readFactFn,
        mutedEvents,
        ...(sessionFn && { sessionFn }),
      })
    )
    .listen();
};
