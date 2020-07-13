const deps = require("./deps");

module.exports = ({
  saveEventsFn,
  reserveRootCountsFn,
  publishFn,
  hashFn,
  proofsFn,
  saveProofsFn,
  scheduleUpdateForProof,
  startTransactionFn,
  commitTransactionFn,
}) => async (req, res) => {
  const eventNumberOffsets = {};

  const eventRootCounts = req.body.events.reduce((result, event) => {
    if (result[event.data.root] == undefined) result[event.data.root] = 0;
    result[event.data.root]++;
    return result;
  }, {});

  const transaction = await startTransactionFn();

  //TODO
  //eslint-disable-next-line no-console
  console.log({ transaction2: transaction });

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
  const allProofs = [];

  const eventsByRoot = {};
  for (const event of req.body.events) {
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
                info: { expected: req.body.number, actual: number },
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

  if (transaction) await commitTransactionFn(transaction);

  await Promise.all([
    ...savedEvents.map((e) =>
      publishFn(
        {
          root: e.data.root,
        },
        e.data.headers.topic
      )
    ),
    ...allProofs.map((proof) => scheduleUpdateForProof(proof)),
  ]);

  res.sendStatus(204);
};
