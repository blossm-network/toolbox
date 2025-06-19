import deps from "./deps.js";

export default ({
  saveEventsFn,
  reserveRootCountsFn,
  publishFn,
  createTransactionFn,
  idempotencyConflictCheckFn,
}) => async (req, res) => {
  const uniqueEventData = [];

  const timestamp = deps.dateString();

  await Promise.all(
    req.body.eventData.map(async ({ event, number }) => {
      if (event.headers.idempotency != undefined) {
        const conflict = await idempotencyConflictCheckFn(
          event.headers.idempotency
        );

        //If theres no idempotency conflict in the database and no local conflict, proceed.
        if (
          conflict ||
          uniqueEventData.some(
            ({ event: uniqueEvent }) =>
              uniqueEvent.headers.idempotency == event.headers.idempotency
          )
        )
          return;
      }
      uniqueEventData.push({ event, ...(number != undefined && { number }) });
    })
  );

  const { receipt } = await createTransactionFn(
    deps.postTransaction({
      eventData: uniqueEventData,
      tx: req.body.tx,
      saveEventsFn,
      reserveRootCountsFn,
    })
  );

  if (process.env.NODE_ENV != "local")
    await Promise.all(
      receipt.map((e) =>
        publishFn(
          {
            root: e.root,
            action: e.action,
            domain: process.env.DOMAIN,
            service: process.env.SERVICE,
            network: process.env.NETWORK,
            timestamp,
          },
          e.topic
        )
      )
    );

  res.sendStatus(204);
};
