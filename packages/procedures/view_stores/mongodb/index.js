const logger = require("@blossm/logger");

const deps = require("./deps");

let _viewStore;

const typeKey = "$type";

const viewStore = async ({ schema, indexes, secretFn }) => {
  if (_viewStore != undefined) {
    logger.info("Thank you existing database.");
    return _viewStore;
  }

  _viewStore = deps.db.store({
    name: `_${process.env.CONTEXT}${
      process.env.SERVICE ? `.${process.env.SERVICE}` : ""
    }${process.env.DOMAIN ? `.${process.env.DOMAIN}` : ""}.${process.env.NAME}`,
    schema: {
      body: {
        id: { [typeKey]: String, unique: true },
        ...deps.formatSchema(schema, typeKey),
      },
      headers: {
        trace: { [typeKey]: String },
        context: {
          [typeKey]: {
            root: String,
            domain: String,
            service: String,
            network: String,
            _id: false,
          },
          required: true,
        },
        created: {
          [typeKey]: Date,
          required: true,
          default: deps.dateString,
        },
        modified: {
          [typeKey]: Date,
          required: true,
          default: deps.dateString,
        },
        _id: false,
      },
    },
    indexes,
    typeKey,
    connection: {
      protocol: process.env.MONGODB_PROTOCOL,
      user: process.env.MONGODB_USER,
      password:
        process.env.NODE_ENV == "local"
          ? process.env.MONGODB_USER_PASSWORD
          : await secretFn("mongodb-view-store"),
      host: process.env.MONGODB_HOST,
      database: process.env.MONGODB_DATABASE,
      parameters: { authSource: "admin", retryWrites: true, w: "majority" },
      autoIndex: true,
    },
  });
  return _viewStore;
};

module.exports = async ({
  schema,
  indexes,
  secretFn,
  getFn,
  putFn,
  one,
} = {}) => {
  const allIndexes = [
    [{ "body.id": 1 }],
    [
      { ["headers.context.root"]: 1 },
      { ["headers.context.domain"]: 1 },
      { ["headers.context.service"]: 1 },
      { ["headers.context.network"]: 1 },
    ],
  ];

  if (indexes) {
    const customIndexes = [];
    for (const index of indexes) {
      let customElement = {};
      for (const element of index) {
        for (const key in element) {
          customElement[`body.${key}`] = element[key];
        }
      }
      customIndexes.push([customElement]);
    }
    allIndexes.push(...customIndexes);
  }

  const store = await viewStore({
    schema,
    indexes: allIndexes,
    secretFn,
  });

  const streamFn = async ({ query, sort, parallel, fn }) => {
    const cursor = deps.db
      .find({
        store,
        query,
        ...(sort && { sort }),
        options: {
          lean: true,
        },
      })
      .cursor();

    return await cursor.eachAsync(fn, { parallel });
  };

  const findFn = async ({ query, limit, skip, sort }) =>
    await deps.db.find({
      store,
      query,
      ...(limit && { limit }),
      ...(skip && { skip }),
      ...(sort && { sort }),
      options: {
        lean: true,
      },
    });

  const countFn = async ({ query }) =>
    await deps.db.count({
      store,
      query,
    });

  const writeFn = async ({ query, data }) => {
    const update = {};
    const setKey = "$set";
    for (const key of Object.keys(data)) {
      if (key.charAt(0) == "$") {
        update[key] = {
          ...update[key],
          ...data[key],
        };
      } else {
        update[setKey] = {
          ...update[setKey],
          [key]: data[key],
        };
      }
    }

    //TODO
    //eslint-disable-next-line no-console
    console.log("LETS SEE: ", { query, update });
    return await deps.db.write({
      store,
      query,
      update,
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    });
  };

  const removeFn = async (query) =>
    await deps.db.remove({
      store,
      query,
    });

  deps.viewStore({
    streamFn,
    findFn,
    writeFn,
    removeFn,
    countFn,
    ...(getFn && { getFn }),
    ...(putFn && { putFn }),
    ...(one && { one }),
  });
};
