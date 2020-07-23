const deps = require("./deps");

module.exports = ({
  // eventData is { event, number }, where `number` is the only acceptable number for this event.
  eventData,
  saveEventsFn,
  reserveRootCountsFn,
  hashFn,
  scenario: {
    path: scenarioPath = [],
    claims: scenarioClaims,
    trace: scenarioTrace,
  } = {},
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
          const scenario = {
            ...(scenarioClaims && { claims: scenarioClaims }),
            ...(scenarioTrace && { trace: scenarioTrace }),
            path: scenarioPath,
          };
          const hashedPayload = hashFn(payload);
          const hashedContext = hashFn(context);
          const hashedScenario = hashFn(scenario);

          const headers = {
            root: event.headers.root,
            action: event.headers.action,
            domain: event.headers.domain,
            service: event.headers.service,
            network: event.headers.network,
            topic: event.headers.topic,
            version: event.headers.version,
            created: event.headers.created,
            committed: deps.dateString(),
            nonce: deps.nonce(),
            number: allottedNumber,
            hashes: {
              payload: hashedPayload,
              context: hashedContext,
              scenario: hashedScenario,
            },
          };

          const hash = hashFn(headers);

          normalizedEvents.push({
            hash,
            headers,
            payload,
            context,
            scenario,
          });
        })
      );
    })
  );

  const savedEvents = await saveEventsFn({
    events: normalizedEvents,
    ...(transaction && { transaction }),
  });

  return { events: savedEvents };
};
