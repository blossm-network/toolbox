const deps = require("./deps");
const { rootStream } = require("@blossm/event-store/deps");

module.exports = ({
  snapshotStore,
  eventStore,
  countsStore,
  handlers,
}) => async () => {
  const aggregateFn = deps.aggregate({ eventStore, snapshotStore, handlers });
  const rootStreamFn = deps.rootStream({ countsStore });

  await rootStreamFn({
    fn: async ({ root }) => {
      const aggregate = await aggregateFn(root);

      const tree = deps.merkle([
        ...aggregate.events.map((e) => e.hash),
        ...(aggregate.snapshot ? aggregate.snapshot.hash : []),
      ]);

      //Get all events since the latest snapshot.
      //Save tree
      //Compute merkle root of previous snpashot + all events.
      //save new snapshot with the previous snapshot hash.
      //if no new events, save snapshot as the same as the previous one.
      await deps.db.create({
        store: snapshotStore,
        data: {
          $set: {
            data: {
              lastEventNumber: aggregate.lastEventNumber,
            },
          },
        },
        options: {
          lean: true,
          omitUndefined: true,
          upsert: true,
          new: true,
          runValidators: false,
          setDefaultsOnInsert: false,
        },
      });
    },
    parallel: 100,
  });
};
