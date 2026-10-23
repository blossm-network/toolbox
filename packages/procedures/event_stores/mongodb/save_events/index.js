import logger from "@blossm/logger";

import deps from "./deps.js";

export default ({ eventStore, handlers }) => async ({
  events,
  transaction,
}) => {
  for (const event of events) {
    const handler = handlers[event.headers.action];

    if (!handler)
      throw deps.badRequestError.message("Event handler not specified.", {
        info: {
          action: event.headers.action,
        },
      });
  }

  try {
    await deps.db.create({
      store: eventStore,
      data: events,
      ...(transaction && { options: { session: transaction } }),
    });
  } catch (err) {
    logger.verbose("Insert all error", { err, writeErrors: err.writeErrors });

    if (err.code == 11000) {
      const duplicateKeyObjects = [];
      const start = "key: {";
      const end = "}";

      const writeErrors = Array.isArray(err.writeErrors) ? err.writeErrors : [err];
      for (const writeError of writeErrors) {
        const error = writeError.err || writeError;
        const keyValue = error.keyValue || (error.errInfo && error.errInfo.keyValue);
        if (keyValue) {
          duplicateKeyObjects.push(keyValue);
          continue;
        }
        const message = error.errmsg || error.message;
        if (typeof message != "string") continue;
        const startIndex = message.lastIndexOf(start);
        const endIndex = message.lastIndexOf(end);
        if (startIndex < 0 || endIndex < 0) continue;

        const string = message.substr(
          startIndex + start.length,
          endIndex - startIndex - start.length
        );
        const separator = string.indexOf(":");
        if (separator < 0) continue;
        const key = string.slice(0, separator);
        const value = string.slice(separator + 1);
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
