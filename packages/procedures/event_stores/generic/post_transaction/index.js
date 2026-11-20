import deps from "./deps.js";

export default ({
  // eventData is { event, number }, where `number` is the only acceptable number for this event.
  eventData,
  saveEventsFn,
  normalizeTransactionFn,
  // Optional adapter casting; the returned payload is hashed and persisted as is.
  normalizePayloadFn,
  reserveRootCountsFn,
  tx: { path: txPath = [], claims: txClaims, id: txId, ip: txIp } = {},
}) => async (transaction) => {
  const tx = await normalizeTransactionFn({
    ...(txClaims && { claims: txClaims }),
    ...(txId && { id: txId }),
    ...(txIp && { ip: txIp }),
    path: txPath,
  });

  // This function reruns after a known transaction abort, so a normalizer gets
  // its own copy of the JSON payload: mutating it cannot alter the submission
  // or a later attempt. Without a normalizer the submitted payload is kept.
  const payloads = await Promise.all(
    eventData.map(async ({ event: { payload = {} } }) =>
      normalizePayloadFn
        ? normalizePayloadFn(structuredClone(payload))
        : payload
    )
  );

  const eventRootCounts = eventData.reduce((result, { event }) => {
    if (result[event.headers.root] == undefined) result[event.headers.root] = 0;
    result[event.headers.root]++;
    return result;
  }, {});

  const eventNumberOffsets = {};

  const updatedCountObjects = [];
  for (const root of Object.keys(eventRootCounts).sort()) {
    updatedCountObjects.push(
      await reserveRootCountsFn({
        root,
        amount: eventRootCounts[root],
        ...(transaction && { transaction }),
      })
    );
  }

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
  for (const [index, { event, number }] of eventData.entries()) {
    if (eventDataByRoot[event.headers.root] == undefined)
      eventDataByRoot[event.headers.root] = [];
    eventDataByRoot[event.headers.root].push({
      event,
      number,
      payload: payloads[index],
    });
  }
  await Promise.all(
    Object.keys(eventDataByRoot).map(async (key) => {
      await Promise.all(
        eventDataByRoot[key].map(async ({ event, number, payload }) => {
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
          const groupsAdded = event.groupsAdded;
          const groupsRemoved = event.groupsRemoved;
          const hashedPayload = deps.hash(payload).create();
          const hashedContext = deps.hash(context).create();
          const hashedGroupsAdded =
            groupsAdded && deps.hash(groupsAdded).create();
          const hashedGroupsRemoved =
            groupsRemoved && deps.hash(groupsRemoved).create();
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
            nonce: `${event.headers.root}_${allottedNumber}`,
            number: allottedNumber,
            pHash: hashedPayload,
            cHash: hashedContext,
            ...(hashedGroupsAdded && { gaHash: hashedGroupsAdded }),
            ...(hashedGroupsRemoved && { grHash: hashedGroupsRemoved }),
            tHash: hashedTx,
          };

          const hash = deps.hash(headers).create();

          normalizedEvents.push({
            hash,
            headers,
            payload,
            context,
            ...(groupsAdded && { groupsAdded }),
            ...(groupsRemoved && { groupsRemoved }),
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
