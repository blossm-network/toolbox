const deps = require("./deps");

module.exports = ({ eventStore, snapshotStore, handlers }) => async (root) => {
  const snapshot = await deps.db.findOne({
    store: snapshotStore,
    query: {
      root,
    },
    options: {
      lean: true,
    },
  });

  const cursor = deps.db
    .find({
      store: eventStore,
      query: {
        "data.root": root,
        ...(snapshot && { "data.number": { $gt: snapshot.lastEventNumber } }),
      },
      sort: {
        "data.number": 1,
      },
      options: {
        lean: true,
      },
    })
    .cursor();

  let aggregate = snapshot && {
    root,
    lastEventNumber: snapshot ? snapshot.lastEventNumber : {},
    state: snapshot ? snapshot.state : {},
  };

  await cursor.eachAsync((event) => {
    const handler = handlers[event.data.headers.action];
    if (!handler)
      throw deps.badRequestError.message("Event handler not specified.", {
        info: {
          action: event.data.headers.action,
        },
      });

    aggregate = {
      root: event.data.root,
      lastEventNumber: event.data.number,
      state: handler(aggregate ? aggregate.state : null, event.data.payload),
    };
  });

  return aggregate;
};
