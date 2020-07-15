const deps = require("./deps");
const logger = require("@blossm/logger");

const groomResults = (results) =>
  results.map((result) => {
    delete result._id;
    delete result.__v;
    return result;
  });

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
      // options: {
      // ordered: false,
      ...(transaction && { options: { session: transaction } }),
      // },
    });
    //TODO
    //eslint-disable-next-line no-console
    console.log({ results });
    return groomResults(results);
  } catch (err) {
    logger.verbose("Insert all error", { err, writeErrors: err.writeErrors });
    //TODO
    //eslint-disable-next-line no-console
    console.log({ err });

    if (err.code == 11000) {
      const duplicateKeyObjects = [];
      const start = "key: {";
      const end = "}";

      for (const error of err.writeErrors) {
        const startIndex = error.errmsg.lastIndexOf(start);
        const endIndex = error.errmsg.lastIndexOf(end);
        if (startIndex < 0 || endIndex < 0) continue;

        const string = error.errmsg.substr(
          startIndex + start.length,
          endIndex - startIndex - start.length
        );
        const [key, value] = string.trim().split(":");
        const object = {
          [key.trim().replace(/'/g, "")]: value.trim().replace(/'/g, ""),
        };
        duplicateKeyObjects.push(object);
      }

      throw deps.preconditionFailedError.message("Duplicates.", {
        info: duplicateKeyObjects,
        cause: err,
      });
    } else {
      throw err;
    }
  }
};
