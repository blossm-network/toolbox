const deps = require("./deps");

module.exports = ({
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

    if (!result)
      throw deps.resourceNotFoundError.message("This root wasn't found.", {
        info: { root: req.params.root },
      });

    res.send(result);
  } else {
    const results = await deps.query({
      findSnapshotsFn,
      findEventsFn,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })({
      key: req.query.key,
      value: req.query.value,
    });
    res.send(results);
  }
};
