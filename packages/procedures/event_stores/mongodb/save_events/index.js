const deps = require("./deps");

const { preconditionFailed, badRequest } = require("@blossm/errors");

module.exports = ({ eventStore, handlers }) => async (events) => {
  for (const event of events) {
    const handler = handlers[event.headers.action];

    // TODO write test for this.
    if (!handler)
      throw badRequest.message("Event handler not specified.", {
        info: {
          action: event.headers.action,
        },
      });
  }

  try {
    const results = await deps.db.create({
      store: eventStore,
      data: events,
    });
    const groomedResults = results.map((result) => {
      delete result._id;
      delete result.__v;
      return result;
    });
    return groomedResults;
  } catch (e) {
    if (e.code == 11000) {
      throw preconditionFailed.eventNumberDuplicate();
    } else {
      throw e;
    }
  }
};
