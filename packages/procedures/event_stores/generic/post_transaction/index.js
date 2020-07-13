const deps = require("./deps");

module.exports = ({
  events,
  saveEventsFn,
  reserveRootCountsFn,
  hashFn,
  proofsFn,
  saveProofsFn,
}) => async (transaction) => {
  const eventRootCounts = events.reduce((result, event) => {
    if (result[event.data.root] == undefined) result[event.data.root] = 0;
    result[event.data.root]++;
    return result;
  }, {});

  const eventNumberOffsets = {};
  const allProofs = [];

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

  const eventsByRoot = {};
  for (const event of events) {
    if (eventsByRoot[event.data.root] == undefined)
      eventsByRoot[event.data.root] = [];
    eventsByRoot[event.data.root].push(event);
  }
  await Promise.all(
    Object.keys(eventsByRoot).map(async (key) => {
      await Promise.all(
        eventsByRoot[key].map(async (event) => {
          if (!eventNumberOffsets[event.data.root])
            eventNumberOffsets[event.data.root] = 0;

          const topicParts = event.data.headers.topic.split(".");
          const topicDomain = topicParts[0];
          const topicService = topicParts[1];

          if (
            topicDomain != process.env.DOMAIN ||
            topicService != process.env.SERVICE
          )
            throw deps.badRequestError.message(
              "This event store can't accept this event.",
              {
                info: {
                  expected: `${process.env.DOMAIN}.${process.env.SERVICE}`,
                  actual: `${topicDomain}.${topicService}`,
                },
              }
            );

          const root = event.data.root;

          const number =
            currentEventCounts[event.data.root] +
            eventNumberOffsets[event.data.root];

          if (event.number && event.number != number)
            throw deps.preconditionFailedError.message(
              "Event number incorrect.",
              {
                info: { expected: event.number, actual: number },
              }
            );

          eventNumberOffsets[event.data.root]++;

          const now = deps.dateString();

          const data = {
            number,
            root: event.data.root,
            id: `${root}_${number}`,
            saved: now,
            payload: event.data.payload,
            headers: event.data.headers,
          };

          const hash = await hashFn(data);
          const proofs = await proofsFn(hash);

          for (const proof of proofs) proof.id = deps.uuid();

          normalizedEvents.push({
            data,
            hash,
            proofs: proofs.map((proof) => proof.id),
          });
          allProofs.push(...proofs);
        })
      );
    })
  );

  const savedEvents = await saveEventsFn(
    normalizedEvents,
    ...(transaction ? [{ transaction }] : [])
  );
  await saveProofsFn(allProofs, ...(transaction ? [{ transaction }] : []));

  return { events: savedEvents, proofs: allProofs };
};
