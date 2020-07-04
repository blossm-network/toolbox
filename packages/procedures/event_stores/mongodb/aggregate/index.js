const deps = require("./deps");

module.exports = ({ eventStore, snapshotStore, handlers }) => async (root) => {
  const [events, snapshot] = await Promise.all([
    deps.db.find({
      store: eventStore,
      query: {
        root,
      },
      sort: {
        "headers.number": 1,
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
      snapshot ? event.headers.number > snapshot.headers.lastEventNumber : true
    )
    .reduce(
      (accumulator, event) => {
        const handler = handlers[event.headers.action];
        if (!handler)
          throw deps.badRequestError.message("Event handler not specified.", {
            info: {
              action: event.headers.action,
            },
          });

        return {
          headers: {
            root: accumulator.headers.root,
            lastEventNumber: event.headers.number,
          },
          state: handler(accumulator.state, event.payload),
        };
      },
      {
        headers: snapshot ? snapshot.headers : { root },
        state: snapshot ? snapshot.state : {},
      }
    );

  return aggregate;
};
