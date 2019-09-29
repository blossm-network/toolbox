const logger = require("@sustainers/logger");

const deps = require("./deps");

const aggregateStoreName = `${process.env.DOMAIN}.aggregate`;

let _eventStore;
let _aggregateStore;

const eventStore = async () => {
  if (_eventStore != undefined) {
    logger.info("Thank you existing event store database.");
    return _eventStore;
  }

  _eventStore = deps.store({
    name: `${process.env.DOMAIN}`,
    strict: false,
    connection: {
      user: process.env.MONGODB_USER,
      password: await deps.secret("mongodb"),
      host: process.env.MONGODB_HOST,
      database: process.env.MONGODB_DATABASE,
      parameters: { authSource: "admin", retryWrites: true, w: "majority" },
      autoIndex: true,
      onOpen: () => logger.info("Thank you database."),
      onError: err => logger.error("Database has errored.", { err })
    }
  });

  return _eventStore;
};

const aggregateStore = async ({ schema, indexes }) => {
  if (_aggregateStore != undefined) {
    logger.info("Thank you existing aggregate store database.");
    return _aggregateStore;
  }

  _aggregateStore = deps.store({
    name: aggregateStoreName,
    schema,
    indexes
  });

  return _aggregateStore;
};

module.exports = async ({ schema } = {}) => {
  if (schema) {
    schema.id = { type: String, required: true, unique: true };
    schema.created = { type: String, required: true };
  }

  const indexes = [[{ id: 1 }], [{ "headers.root": 1 }], [{ created: 1 }]];

  const eStore = await eventStore();
  const aStore = await aggregateStore({ schema, indexes });

  deps
    .server()
    .get(deps.get({ store: aStore }))
    .post(deps.post({ store: eStore, aggregateStoreName }))
    .listen();
};
