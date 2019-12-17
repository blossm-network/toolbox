const logger = require("@blossm/logger");

const deps = require("./deps");

const aggregateStoreName = `${process.env.DOMAIN}.aggregate`;

let _eventStore;
let _aggregateStore;

const eventStore = async () => {
  if (_eventStore != undefined) {
    logger.info("Thank you existing event store database.");
    return _eventStore;
  }

  _eventStore = deps.db.store({
    name: `${process.env.DOMAIN}`,
    schema: {
      id: { type: String, required: true, unique: true },
      created: { type: String, required: true },
      payload: { type: Object, required: true },
      headers: {
        root: { type: String, required: true },
        topic: { type: String, required: true },
        version: { type: Number, required: true },
        context: { type: Object },
        trace: { type: String },
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
      protocol: process.env.MONGODB_PROTOCOL,
      user: process.env.MONGODB_USER,
      password:
        process.env.NODE_ENV == "local"
          ? process.env.MONGODB_USER_PASSWORD
          : await deps.secret("mongodb"),
      host: process.env.MONGODB_HOST,
      database: process.env.MONGODB_DATABASE,
      parameters: { authSource: "admin", retryWrites: true, w: "majority" },
      autoIndex: true
    }
  });

  return _eventStore;
};

const aggregateStore = async ({ schema }) => {
  if (_aggregateStore != undefined) {
    logger.info("Thank you existing aggregate store database.");
    return _aggregateStore;
  }

  _aggregateStore = deps.db.store({
    name: aggregateStoreName,
    schema,
    indexes: [[{ "value.headers.root": 1 }]]
  });

  return _aggregateStore;
};

module.exports = async ({ schema, publishFn } = {}) => {
  const eStore = await eventStore();
  const aStore = await aggregateStore({ schema });

  const writeFn = async ({ id, data }) =>
    deps.db.write({
      store: eStore,
      query: { id },
      update: {
        $set: data
      },
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    });

  const mapReduceFn = async ({ id }) =>
    await deps.db.mapReduce({
      store: eStore,
      query: { id },
      map: deps.normalize,
      reduce: deps.reduce,
      out: { reduce: aggregateStoreName }
    });

  const findOneFn = async ({ root }) =>
    await deps.db.findOne({
      store: aStore,
      query: {
        "value.headers.root": root
      },
      options: {
        lean: true
      }
    });

  deps.eventStore({
    findOneFn,
    writeFn,
    mapReduceFn,
    publishFn
  });
};
