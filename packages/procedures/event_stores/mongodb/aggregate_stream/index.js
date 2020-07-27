const deps = require("./deps");

module.exports = ({ eventStore, snapshotStore, countsStore, handlers }) => ({
  timestamp,
  parallel = 1,
  fn,
}) =>
  deps.rootStream({ countsStore })({
    parallel,
    fn: async ({ root }) => {
      const aggregate = await deps.aggregate({
        eventStore,
        snapshotStore,
        handlers,
      })(root, { ...(timestamp && { timestamp }) });

      if (!aggregate) return;

      await fn({
        state: aggregate.state,
        context: aggregate.context,
        headers: aggregate.headers,
      });
    },
  });
