const deps = require("./deps");

module.exports = ({ eventStore, snapshotStore, countsStore, handlers }) => ({
  timestamp,
  fn,
}) =>
  deps.rootStream({ countsStore })({
    //Arbitrarily big number. May need refining.
    parallel: 100,
    fn: async ({ root }) => {
      const aggregate = await deps.aggregate({
        eventStore,
        snapshotStore,
        handlers,
      })(root, { ...(timestamp && { timestamp }) });

      if (!aggregate) return;

      await fn({
        state: aggregate.state,
        headers: aggregate.headers,
        context: aggregate.context,
        lastEventNumber: aggregate.lastEventNumber,
      });
    },
  });
