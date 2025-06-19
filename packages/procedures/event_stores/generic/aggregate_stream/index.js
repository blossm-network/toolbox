import deps from "./deps.js";

export default ({
  rootStreamFn,
  findOneSnapshotFn,
  eventStreamFn,
  handlers,
}) => async (req, res) => {
  if (req.query.root) {
    const aggregate = await deps.aggregate({
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })(req.query.root, {
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
  } else {
    await rootStreamFn({
      ...(req.query.parallel && { parallel: req.query.parallel }),
      ...(req.query.updatedOnOrAfter && {
        updatedOnOrAfter: req.query.updatedOnOrAfter,
      }),
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
  }
  res.end();
};
