const deps = require("./deps");
const logger = require("@blossm/logger");

module.exports = ({ eventStore, handlers }) => async (
  events,
  { transaction } = {}
) => {
  for (const event of events) {
    const handler = handlers[event.data.headers.action];

    if (!handler)
      throw deps.badRequestError.message("Event handler not specified.", {
        info: {
          action: event.data.headers.action,
        },
      });
  }

  try {
    const results = await deps.db.create({
      store: eventStore,
      data: events,
      ...(transaction && { options: { session: transaction } }),
    });
    const groomedResults = results.map((result) => {
      delete result._id;
      delete result.__v;
      return result;
    });
    return groomedResults;
  } catch (e) {
    if (e.code == 11000) {
      logger.verbose("blossm: 11000 Mongodb duplicate error", {
        e,
        code: e.code,
        message: e.message,
      });
      throw deps.preconditionFailedError.message("Duplicate.");
    } else {
      throw e;
    }
  }
};
