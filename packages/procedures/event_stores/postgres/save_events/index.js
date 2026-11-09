import deps from "./deps.js";

export default ({ eventStore, publicationsStore, handlers }) =>
  async ({ events, transaction }) => {
    if (publicationsStore && !transaction)
      throw deps.internalServerError.message(
        "Durable publications require an event transaction."
      );

    for (const event of events) {
      if (!handlers[event.headers.action])
        throw deps.badRequestError.message("Event handler not specified.", {
          info: { action: event.headers.action },
        });
    }

    try {
      await deps.db.create({ store: eventStore, data: events, transaction });
      if (publicationsStore && events.length)
        await deps.db.create({
          store: publicationsStore,
          data: events.map(deps.createPublication),
          transaction,
        });
    } catch (err) {
      if (err.code == "23505")
        throw deps.preconditionFailedError.message("Duplicates.", {
          cause: err,
          info: { constraint: err.constraint },
        });
      throw err;
    }
  };
