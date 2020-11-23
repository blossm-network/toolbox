const deps = require("./deps");

module.exports = ({ findOneSnapshotFn, eventStreamFn, handlers }) => async (
  root,
  { timestamp, includeEvents = false, eventLimit } = {}
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
        nonce: snapshot.headers.nonce,
        number: snapshot.headers.number,
        lastEventNumber: snapshot.headers.lastEventNumber,
        snapshotHash: snapshot.hash,
        timestamp: snapshot.headers.created,
      }),
    },
    ...(snapshot && {
      state: snapshot.state,
      context: snapshot.context,
    }),
    groups: (snapshot && snapshot.groups) || [],
    ...(snapshot && {
      txIds: snapshot.txIds,
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
    ...(eventLimit && {
      limit: eventLimit,
    }),
    fn: (event) => {
      const handler = handlers[event.headers.action];
      if (!handler)
        throw deps.badRequestError.message("Event handler not specified.", {
          info: {
            action: event.headers.action,
          },
        });

      aggregate.headers.lastEventNumber = event.headers.number;
      aggregate.headers.timestamp = event.headers.created;
      aggregate.state = handler(aggregate.state || {}, event.payload);
      const allTxIds = [
        ...(event.tx.id ? [event.tx.id] : []),
        ...(aggregate.txIds || []),
      ];

      aggregate.txIds = allTxIds
        .filter((id, index, self) => self.indexOf(id) === index)
        .slice(0, 10);

      if (aggregate.context) {
        aggregate.context = Object.keys(event.context).reduce((result, key) => {
          const resultKeys = Object.keys(result);
          const value = event.context[key];
          if (!resultKeys.includes(key)) {
            result[key] = value;
          } else if (
            value !== result[key] &&
            (typeof value != "object" ||
              value.root != result[key].root ||
              value.service != result[key].service ||
              value.network != result[key].network)
          ) {
            result[key] = false;
          }
          return result;
        }, aggregate.context);
      } else {
        aggregate.context = event.context;
      }

      if (event.groupsAdded)
        aggregate.groups = aggregate.groups.concat(event.groupsAdded);

      if (event.groupsRemoved)
        aggregate.groups = aggregate.groups.filter((group) => {
          for (const groupRemoved of event.groupsRemoved) {
            if (
              groupRemoved.root == group.root &&
              groupRemoved.service == group.service &&
              groupRemoved.network == group.network
            )
              return false;
          }
          return true;
        });

      if (includeEvents) aggregate.events.push(event);
    },
  });

  return aggregate.state && aggregate;
};
