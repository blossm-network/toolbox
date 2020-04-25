const logger = require("@blossm/logger");

const deps = require("./deps");

let _numberStore;

const numberStore = async () => {
  if (_numberStore != undefined) {
    logger.info("Thank you existing count store database.");
    return _numberStore;
  }

  _numberStore = deps.db.store({
    name: `${process.env.NAME}${
      process.env.DOMAIN ? `.${process.env.DOMAIN}` : ""
    }${process.env.SERVICE ? `.${process.env.SERVICE}` : ""}.${
      process.env.CONTEXT
    }.numbers`,
    schema: {
      root: { type: String, required: true },
      number: { type: Number, required: true, default: 0 },
    },
    indexes: [[{ root: 1 }], [{ number: 1 }]],
    connection: {
      protocol: process.env.MONGODB_PROTOCOL,
      user: process.env.MONGODB_USER,
      password:
        process.env.NODE_ENV == "local"
          ? process.env.MONGODB_USER_PASSWORD
          : await deps.secret("mongodb-event-handler"),
      host: process.env.MONGODB_HOST,
      database: process.env.MONGODB_DATABASE,
      parameters: { authSource: "admin", retryWrites: true, w: "majority" },
      autoIndex: true,
    },
  });

  return _numberStore;
};

module.exports = async ({ mainFn, streamFn } = {}) => {
  const store = await numberStore();

  const numberFn = async ({ root }) => {
    const [{ number }] = await deps.db.find({
      store,
      query: { root },
      pageSize: 1,
      options: { lean: true },
    });

    return number;
  };

  const incrementFn = async ({ root, from }) =>
    deps.db.write({
      store,
      query: { root, number: from },
      update: { $inc: { number: 1 } },
      options: {
        lean: true,
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    });

  deps.eventHandler({
    mainFn,
    streamFn,
    numberFn,
    incrementFn,
  });
};
