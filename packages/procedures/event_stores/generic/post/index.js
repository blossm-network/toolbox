import deps from "./deps.js";

export default ({
  canonicalFormat,
    saveEventsFn,
    reserveRootCountsFn,
    publishFn,
    createTransactionFn,
    idempotencyConflictCheckFn,
  }) =>
  async (req, res) => {
    if (
      canonicalFormat != undefined &&
      req.body.eventData.some(
        ({ event }) => (event.headers.canonicalFormat ?? 1) != canonicalFormat
      )
    )
      throw deps.badRequestError.message(
        "Event canonical format does not match this store."
      );

    const timestamp = deps.dateString();
    const conflicts = await Promise.all(
      req.body.eventData.map(({ event }) =>
        event.headers.idempotency == undefined
          ? false
          : idempotencyConflictCheckFn(event.headers.idempotency)
      )
    );
    const seen = new Set();
    const uniqueEventData = req.body.eventData.filter(({ event }, index) => {
      if (conflicts[index]) return false;
      const { idempotency } = event.headers;
      if (idempotency == undefined) return true;
      if (seen.has(idempotency)) return false;
      seen.add(idempotency);
      return true;
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
