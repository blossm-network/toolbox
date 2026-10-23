import deps from "./deps.js";

export default ({
    saveEventsFn,
    reserveRootCountsFn,
    publishFn,
    createTransactionFn,
    idempotencyConflictCheckFn,
  }) =>
  async (req, res) => {
    const timestamp = deps.dateString();
    const conflicts = await Promise.all(
      req.body.eventData.map(({ event }) =>
        event.headers.idempotency == undefined
          ? false
          : idempotencyConflictCheckFn(event.headers.idempotency)
      )
    );
    const seen = new Set();
    const uniqueEventData = req.body.eventData.filter((entry, index) => {
      const key = entry.event.headers.idempotency;
      const duplicate = conflicts[index] || seen.has(key);
      seen.add(key);
      return entry.number != undefined || key == undefined || !duplicate;
    });

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
