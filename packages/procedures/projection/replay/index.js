import { createHash } from "node:crypto";
import { badRequest } from "@blossm/errors";

export default ({ replayStores, playFn, rootStreamFn, requireReplayId = false }) => async (req, res) => {
  const replayId = (req.body && req.body.replayId) ||
    (req.headers && req.headers["x-cloudtasks-taskname"]);
  if (requireReplayId && !replayId)
    throw badRequest.message("A stable projection replay ID is required.");
  await Promise.all(
    replayStores.map((store) =>
      rootStreamFn({
        domain: store.domain,
        service: store.service,
        fn: ({ root }) =>
          playFn({
            root,
            domain: store.domain,
            service: store.service,
            ...(replayId && {
              playId: `replay:${createHash("sha256").update(JSON.stringify([
                replayId, store.service, store.domain, root,
              ])).digest("hex")}`,
            }),
          }),
      })
    )
  );
  res.sendStatus(204);
};
