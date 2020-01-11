const logger = require("@blossm/logger");

const deps = require("./deps");

let _viewStore;

const viewStore = async ({ schema, indexes }) => {
  if (_viewStore != undefined) {
    logger.info("Thank you existing database.");
    return _viewStore;
  }

  _viewStore = deps.db.store({
    name: `${process.env.DOMAIN}.${process.env.NAME}`,
    schema,
    indexes,
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
  return _viewStore;
};

module.exports = async ({ schema, indexes, getFn, postFn, putFn } = {}) => {
  if (schema) {
    schema.id = { type: String, required: true, unique: true };
    schema.created = {
      type: String,
      required: true,
      default: deps.stringDate
    };
    schema.modified = {
      type: String,
      required: true,
      default: deps.stringDate
    };
  }

  const allIndexes = [[{ id: 1 }], [{ created: 1 }], [{ modified: 1 }]];

  if (indexes) {
    allIndexes.push(...indexes);
  }

  const store = await viewStore({
    schema: deps.removeIds({ schema }),
    indexes: allIndexes
  });

  const streamFn = async ({ query, sort, parallel, fn }) => {
    const cursor = deps.db
      .find({
        store,
        query,
        ...(sort && { sort }),
        options: {
          lean: true
        }
      })
      .cursor();

    return await cursor.eachAsync(fn, { parallel });
  };

  const findFn = async ({ query, sort }) =>
    await deps.db.find({
      store,
      query,
      ...(sort && { sort }),
      options: {
        lean: true
      }
    });

  const findOneFn = async ({ id }) =>
    await deps.db.findOne({
      store,
      query: {
        id
      },
      options: {
        lean: true
      }
    });

  const writeFn = async ({ id, data }) => {
    const update = {};
    const setKey = "$set";
    for (const key of Object.keys(data)) {
      if (key.charAt(0) == "$") {
        update[key] = {
          ...update[key],
          ...data[key]
        };
      } else {
        update[setKey] = {
          ...update[setKey],
          [key]: data[key]
        };
      }
    }
    return await deps.db.write({
      store,
      query: { id },
      update,
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    });
  };

  const removeFn = async ({ id }) =>
    await deps.db.remove({
      store,
      query: { id }
    });

  deps.viewStore({
    streamFn,
    findFn,
    findOneFn,
    writeFn,
    removeFn,
    ...(getFn && { getFn }),
    ...(postFn && { postFn }),
    ...(putFn && { putFn })
  });
};
