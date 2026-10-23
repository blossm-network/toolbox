import deps from "./deps.js";

export default ({ eventStore, publicationsStore, actionsStore, actionsFn, handlers }) => async ({
  events,
  transaction,
}) => {
  if ((actionsStore && !actionsFn) || (actionsFn && !actionsStore))
    throw deps.internalServerError.message(
      "Durable actions require an actions store and preparation function."
    );

  if ((publicationsStore || actionsStore) && !transaction)
    throw deps.internalServerError.message(
      "Durable deliveries require an event transaction."
    );

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
    if (publicationsStore && events.length)
      await deps.db.create({
        store: publicationsStore,
        data: events.map(({ hash, headers }) => ({
          hash,
          topic: headers.topic,
          created: headers.committed,
          data: {
            root: headers.root,
            action: headers.action,
            domain: headers.domain,
            service: headers.service,
            network: headers.network,
            timestamp: headers.committed,
          },
        })),
        options: { session: transaction },
      });
    if (actionsStore && events.length) {
      const actions = [];
      for (const event of events) {
        const intents = await actionsFn(event);
        for (const [position, intent] of intents.entries()) {
          const data = JSON.stringify(intent);
          actions.push({
            id: `${event.hash}:${position}`,
            eventHash: event.hash,
            intentHash: deps.hash(data).create(),
            intent: data,
            created: event.headers.committed,
          });
        }
      }
      if (actions.length)
        await deps.db.create({
          store: actionsStore,
          data: actions,
          options: { session: transaction },
        });
    }
  } catch (err) {
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
