const deps = require("./deps");

module.exports = ({ eventStore, snapshotStore, handlers }) => async (root) => {
  //TODO easy. Make events retrieval a stream. See @blossm/mongodb-event-store-root-stream.
  //This will make the fns memory footprint smaller and less prone to crashes.
  const [events, snapshot] = await Promise.all([
    deps.db.find({
      store: eventStore,
      query: {
        "data.root": root,
      },
      sort: {
        "data.number": 1,
      },
      options: {
        lean: true,
      },
    }),
    deps.db.findOne({
      store: snapshotStore,
      query: {
        root,
      },
      options: {
        lean: true,
      },
    }),
  ]);

  if (!events.length && !snapshot) return null;

  const aggregate = events
    .filter((event) =>
      snapshot ? event.data.number > snapshot.lastEventNumber : true
    )
    .reduce(
      (accumulator, event) => {
        const handler = handlers[event.data.headers.action];
        if (!handler)
          throw deps.badRequestError.message("Event handler not specified.", {
            info: {
              action: event.data.headers.action,
            },
          });

        return {
          root: accumulator.root,
          lastEventNumber: event.data.number,
          state: handler(accumulator.state, event.data.payload),
        };
      },
      {
        root: snapshot ? snapshot.root : root,
        state: snapshot ? snapshot.state : {},
      }
    );

  return aggregate;
};
