import deps from "./deps.js";

export default ({
  rootStreamFn,
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
    let pairs;
    try {
      pairs = JSON.parse(req.query.pairs);
    } catch {
      throw deps.badRequestError.message("The query is not valid JSON.");
    }
    const results = await deps.query({
      rootStreamFn,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })(pairs);
    res.send(results);
  }
};
