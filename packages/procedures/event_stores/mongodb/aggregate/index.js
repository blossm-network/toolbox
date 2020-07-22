const deps = require("./deps");

module.exports = ({ eventStore, snapshotStore, handlers }) => async (root) => {
  const snapshot = await deps.db.findOne({
    store: snapshotStore,
    query: {
      "data.root": root,
    },
    sort: {
      "data.created": -1,
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
        ...(snapshot && {
          "data.number": { $gt: snapshot.data.lastEventNumber },
        }),
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
    lastEventNumber: snapshot ? snapshot.data.lastEventNumber : {},
    state: snapshot ? snapshot.data.state : {},
    events: [],
    snapshotHash: snapshot.hash,
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
      state: handler(aggregate ? aggregate.state : {}, event.data.payload),
      ...(aggregate &&
        aggregate.snapshotHash && { snapshotHash: aggregate.snapshotHash }),
      //TODO test
      events: [...(aggregate ? aggregate.events : []), event],
    };
  });

  return aggregate;
};
