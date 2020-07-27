const deps = require("./deps");

module.exports = ({ findOneSnapshotFn, eventStreamFn, handlers }) => async (
  root,
  { timestamp, includeEvents = false } = {}
) => {
  const snapshot = await findOneSnapshotFn({
    query: {
      "headers.root": root,
      ...(timestamp != undefined && {
        "headers.created": { $lte: timestamp },
      }),
    },
    sort: {
      "headers.created": -1,
    },
    select: {
      events: 0,
    },
  });

  const aggregate = {
    headers: {
      root,
      domain: process.env.DOMAIN,
      service: process.env.SERVICE,
      network: process.env.NETWORK,
      ...(snapshot && {
        lastEventNumber: snapshot.headers.lastEventNumber,
        trace: snapshot.headers.trace,
        snapshotHash: snapshot.hash,
      }),
    },
    ...(snapshot && {
      state: snapshot.headers.state,
      context: snapshot.context,
    }),
    ...(includeEvents && { events: [] }),
  };

  await eventStreamFn({
    query: {
      "headers.root": root,
      ...(snapshot && {
        "headers.number": { $gt: snapshot.headers.lastEventNumber },
      }),
      ...(timestamp != undefined && {
        "headers.created": { $lte: timestamp },
      }),
    },
    sort: {
      "headers.number": 1,
    },
    fn: (event) => {
      const handler = handlers[event.headers.action];
      if (!handler)
        throw deps.badRequestError.message("Event handler not specified.", {
          info: {
            action: event.headers.action,
          },
        });

      aggregate.headers.lastEventNumber = event.headers.number;
      aggregate.state = handler(aggregate.state || {}, event.payload);
      aggregate.headers.trace = [
        ...(event.scenario.trace ? [event.scenario.trace] : []),
        ...(aggregate.headers.trace || []),
      ].slice(0, 10);

      if (aggregate.context) {
        const keys = Object.keys(aggregate.context);
        const commonContextKeys = keys.filter((key) => {
          const value = event.context[key];
          return (
            value === aggregate.context[key] ||
            (value &&
              value.root == aggregate.context[key].root &&
              value.service == aggregate.context[key].service &&
              value.network == aggregate.context[key].network)
          );
        });
        aggregate.context = commonContextKeys.reduce((result, key) => {
          result[key] = aggregate.context[key];
          return result;
        }, {});
      } else {
        aggregate.context = event.context;
      }

      if (includeEvents) aggregate.events.push(event);
    },
  });

  return aggregate.state && aggregate;
};
