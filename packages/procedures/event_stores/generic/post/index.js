const deps = require("./deps");

module.exports = ({
  saveEventsFn,
  reserveRootCountsFn,
  publishFn,
  hashFn,
  createTransactionFn,
  idempotencyConflictCheckFn,
}) => async (req, res) => {
  const uniqueEvents = [];
  await Promise.all(
    req.body.events.map(async (event) => {
      if (event.data.idempotency != undefined) {
        const conflict = await idempotencyConflictCheckFn(
          event.data.idempotency
        );

        //If theres no idempotency conflict in the database and no local conflict, proceed.
        if (
          conflict ||
          uniqueEvents.some(
            (uniqueEvent) =>
              uniqueEvent.data.idempotency == event.data.idempotency
          )
        )
          return;
      }
      uniqueEvents.push(event);
    })
  );

  const { events } = await createTransactionFn(
    deps.postTransaction({
      events: uniqueEvents,
      saveEventsFn,
      reserveRootCountsFn,
      hashFn,
    })
  );

  //No need to publish to the same topic twice.
  let publishedTopics = [];
  await Promise.all(
    events.map((e) => {
      if (publishedTopics.includes(e.data.topic)) return;
      publishedTopics.push(e.data.topic);
      return publishFn(
        {
          from: e.data.created,
        },
        e.data.topic
      );
    })
  );

  res.sendStatus(204);
};
