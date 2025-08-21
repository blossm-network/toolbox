import deps from "./deps.js";

export default ({
  findSnapshotsFn,
  findEventsFn,
  findOneSnapshotFn,
  eventStreamFn,
  handlers,
}) => async (req, res) => {
  if (req.params.root) {
    const result = await deps.aggregate({
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })(req.params.root);

    if (!result) {
      if (req.query.notFoundThrows !== "false")
        throw deps.resourceNotFoundError.message("This root wasn't found.", {
          info: { root: req.params.root },
        });
      return res.send();
    }

    res.send(result);
  } else {
    const results = await deps.query({
      findSnapshotsFn,
      findEventsFn,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })(req.query.pairs);
    res.send(results);
  }
};
