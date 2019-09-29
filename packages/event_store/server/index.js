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
    schema: {
      id: { type: String, required: true, unique: true },
      created: { type: String, required: true },
      payload: { type: Object, required: true },
      headers: {
        root: { type: String, required: true },
        topic: { type: String, required: true },
        version: { type: Number, required: true },
        trace: { type: String },
        context: { type: Object },
        created: { type: String, required: true },
        command: {
          id: { type: String, required: true },
          action: { type: String, required: true },
          domain: { type: String, required: true },
          service: { type: String, required: true },
          network: { type: String, required: true },
          issued: { type: String, required: true }
        }
      }
    },
    indexes: [[{ id: 1 }]],
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

const aggregateStore = async ({ schema }) => {
  if (_aggregateStore != undefined) {
    logger.info("Thank you existing aggregate store database.");
    return _aggregateStore;
  }

  _aggregateStore = deps.store({
    name: aggregateStoreName,
    schema,
    indexes: [[{ "headers.root": 1 }]]
  });

  return _aggregateStore;
};

module.exports = async ({ schema } = {}) => {
  const eStore = await eventStore();
  const aStore = await aggregateStore({ schema });

  deps
    .server()
    .get(deps.get({ store: aStore }), { path: "/:root" })
    .post(deps.post({ store: eStore, aggregateStoreName }))
    .listen();
};
