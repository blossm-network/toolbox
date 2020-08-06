const deps = require("./deps");

module.exports = ({
  // eventData is { event, number }, where `number` is the only acceptable number for this event.
  eventData,
  saveEventsFn,
  reserveRootCountsFn,
  tx: { path: txPath = [], claims: txClaims, id: txId, ip: txIp } = {},
}) => async (transaction) => {
  const eventRootCounts = eventData.reduce((result, { event }) => {
    if (result[event.headers.root] == undefined) result[event.headers.root] = 0;
    result[event.headers.root]++;
    return result;
  }, {});

  const eventNumberOffsets = {};

  const [...updatedCountObjects] = await Promise.all(
    Object.keys(eventRootCounts).map((root) =>
      reserveRootCountsFn({
        root,
        amount: eventRootCounts[root],
        ...(transaction && { transaction }),
      })
    )
  );

  const currentEventCounts = updatedCountObjects.reduce(
    (result, countObject) => {
      result[countObject.root] =
        countObject.value - eventRootCounts[countObject.root];
      return result;
    },
    {}
  );

  const normalizedEvents = [];

  const eventDataByRoot = {};
  for (const { event, number } of eventData) {
    if (eventDataByRoot[event.headers.root] == undefined)
      eventDataByRoot[event.headers.root] = [];
    eventDataByRoot[event.headers.root].push({ event, number });
  }
  await Promise.all(
    Object.keys(eventDataByRoot).map(async (key) => {
      await Promise.all(
        eventDataByRoot[key].map(async ({ event, number }) => {
          if (!eventNumberOffsets[event.headers.root])
            eventNumberOffsets[event.headers.root] = 0;

          if (
            event.headers.domain != process.env.DOMAIN ||
            event.headers.service != process.env.SERVICE ||
            event.headers.network != process.env.NETWORK
          )
            throw deps.badRequestError.message(
              "This event store can't accept this event.",
              {
                info: {
                  expected: {
                    domain: process.env.DOMAIN,
                    service: process.env.SERVICE,
                    network: process.env.NETWORK,
                  },
                  actual: {
                    domain: event.headers.domain,
                    service: event.headers.service,
                    network: event.headers.network,
                  },
                },
              }
            );

          const allottedNumber =
            currentEventCounts[event.headers.root] +
            eventNumberOffsets[event.headers.root];

          if (number != undefined && number != allottedNumber)
            throw deps.preconditionFailedError.message(
              "Event number incorrect.",
              {
                info: { expected: event.number, actual: number },
              }
            );

          eventNumberOffsets[event.headers.root]++;

          const context = event.context || {};
          const payload = event.payload || {};
          const tx = {
            ...(txClaims && { claims: txClaims }),
            ...(txId && { id: txId }),
            ...(txIp && { ip: txIp }),
            path: txPath,
          };
          const hashedPayload = deps.hash(payload).create();
          const hashedContext = deps.hash(context).create();
          const hashedTx = deps.hash(tx).create();

          const headers = {
            root: event.headers.root,
            action: event.headers.action,
            domain: event.headers.domain,
            service: event.headers.service,
            network: event.headers.network,
            topic: event.headers.topic,
            version: event.headers.version,
            created: event.headers.created,
            idempotency: event.headers.idempotency,
            committed: deps.dateString(),
            nonce: deps.nonce(),
            number: allottedNumber,
            pHash: hashedPayload,
            cHash: hashedContext,
            tHash: hashedTx,
          };

          const hash = deps.hash(headers).create();

          normalizedEvents.push({
            hash,
            headers,
            payload,
            context,
            tx,
          });
        })
      );
    })
  );

  await saveEventsFn({
    events: normalizedEvents,
    ...(transaction && { transaction }),
  });

  return {
    receipt: normalizedEvents.map((e) => ({
      topic: e.headers.topic,
      created: e.headers.created,
      action: e.headers.action,
      root: e.headers.root,
    })),
  };
};
