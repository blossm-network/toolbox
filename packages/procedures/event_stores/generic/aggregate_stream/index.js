const deps = require("./deps");

module.exports = ({
  rootStreamFn,
  findOneSnapshotFn,
  eventStreamFn,
  handlers,
}) => async (req, res) => {
  await rootStreamFn({
    ...(req.query.parallel && { parallel: req.query.parallel }),
    fn: async ({ root }) => {
      const aggregate = await deps.aggregate({
        findOneSnapshotFn,
        eventStreamFn,
        handlers,
      })(root, {
        ...(req.query.timestamp && { timestamp: req.query.timestamp }),
      });

      if (!aggregate) return;

      res.write(
        JSON.stringify({
          state: aggregate.state,
          context: aggregate.context,
          headers: aggregate.headers,
          txIds: aggregate.txIds,
        })
      );
    },
  });
  res.end();
};
