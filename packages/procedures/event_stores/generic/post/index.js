import { COMMITTED, DUPLICATE } from "@blossm/event-outcome-consts";
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
    const outcomes = [];
    const uniqueEventData = req.body.eventData.filter(({ event }, index) => {
      const { idempotency } = event.headers;
      const duplicate =
        idempotency != undefined && (conflicts[index] || seen.has(idempotency));
      seen.add(idempotency);
      outcomes.push(duplicate ? DUPLICATE : COMMITTED);
      return !duplicate;
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

    if (req.body.returnOutcomes) res.send({ outcomes });
    else res.sendStatus(204);
  };
