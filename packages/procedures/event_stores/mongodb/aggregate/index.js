const deps = require("./deps");

module.exports = ({ eventStore, snapshotStore, handlers }) => async (root) => {
  const snapshot = await deps.db.findOne({
    store: snapshotStore,
    query: {
      "headers.root": root,
    },
    sort: {
      "headers.created": -1,
    },
    options: {
      lean: true,
    },
  });

  const cursor = deps.db
    .find({
      store: eventStore,
      query: {
        "headers.root": root,
        ...(snapshot && {
          "headers.number": { $gt: snapshot.headers.lastEventNumber },
        }),
      },
      sort: {
        "headers.number": 1,
      },
      options: {
        lean: true,
      },
    })
    .cursor();

  const aggregate = {
    root,
    domain: process.env.DOMAIN,
    service: process.env.SERVICE,
    network: process.env.NETWORK,
    ...(snapshot && {
      lastEventNumber: snapshot.headers.lastEventNumber,
      state: snapshot.headers.state,
      trace: snapshot.headers.trace,
      context: snapshot.context,
    }),
  };

  await cursor.eachAsync((event) => {
    const handler = handlers[event.headers.action];
    if (!handler)
      throw deps.badRequestError.message("Event handler not specified.", {
        info: {
          action: event.headers.action,
        },
      });

    aggregate.lastEventNumber = event.headers.number;
    aggregate.state = handler(aggregate.state || {}, event.payload);
    aggregate.trace = [
      ...(event.trace ? [event.trace] : []),
      ...(aggregate.trace || []),
    ].slice(0, 10);

    if (aggregate.context) {
      const keys = Object.keys(aggregate.context);
      const commonContextKeys = keys.filter((key) => {
        const value = event.context[key];
        return (
          value &&
          value.root == aggregate.context[key].root &&
          value.service == aggregate.context[key].service &&
          value.network == aggregate.context[key].network
        );
      });
      aggregate.context = commonContextKeys.reduce((result, key) => {
        result[key] = aggregate.context[key];
        return result;
      }, {});
    } else {
      aggregate.context = event.context;
    }
  });

  return aggregate.state && aggregate;
};
