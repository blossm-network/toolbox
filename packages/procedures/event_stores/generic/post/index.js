const deps = require("./deps");

module.exports = ({
  saveEventsFn,
  reserveRootCountsFn,
  publishFn,
  hashFn,
  proofsFn,
  saveProofsFn,
  scheduleUpdateForProofFn,
  createTransactionFn,
  idempotencyConflictCheckFn,
}) => async (req, res) => {
  const uniqueEvents = [];
  await Promise.all(
    req.body.events.map(async (event) => {
      if (event.data.headers.idempotency != undefined) {
        const conflict = await idempotencyConflictCheckFn(
          event.data.headers.idempotency
        );

        //TODO
        //eslint-disable-next-line no-console
        console.log({
          conflict,
          uniq: uniqueEvents.some(
            (uniqueEvent) =>
              uniqueEvent.data.headers.idempotency ==
              event.data.headers.idempotency
          ),
        });
        //If theres no idempotency conflict in the database and no local conflict, proceed.
        if (
          conflict ||
          uniqueEvents.some(
            (uniqueEvent) =>
              uniqueEvent.data.headers.idempotency ==
              event.data.headers.idempotency
          )
        )
          return;
      }
      uniqueEvents.push(event);
    })
  );

  const { events, proofs } = await createTransactionFn(
    deps.postTransaction({
      events: uniqueEvents,
      saveEventsFn,
      reserveRootCountsFn,
      hashFn,
      proofsFn,
      saveProofsFn,
    })
  );

  await Promise.all([
    ...events.map((e) => {
      return publishFn(
        {
          root: e.data.root,
        },
        e.data.headers.topic
      );
    }),
    ...proofs.map((proof) => scheduleUpdateForProofFn(proof.id)),
  ]);

  res.sendStatus(204);
};
