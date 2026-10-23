import deps from "./deps.js";

export default ({ eventStore, handlers }) =>
  async ({ events, transaction }) => {
    for (const event of events) {
      if (!handlers[event.headers.action])
        throw deps.badRequestError.message("Event handler not specified.", {
          info: { action: event.headers.action },
        });
    }

    try {
      await deps.db.create({ store: eventStore, data: events, transaction });
    } catch (err) {
      if (err.code == "23505")
        throw deps.preconditionFailedError.message("Duplicates.", {
          cause: err,
          info: { constraint: err.constraint },
        });
      throw err;
    }
  };
