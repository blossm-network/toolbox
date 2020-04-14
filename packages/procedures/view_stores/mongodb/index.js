const logger = require("@blossm/logger");

const deps = require("./deps");

let _viewStore;

const viewStore = async ({ schema, indexes }) => {
  if (_viewStore != undefined) {
    logger.info("Thank you existing database.");
    return _viewStore;
  }

  _viewStore = deps.db.store({
    name: `${process.env.CONTEXT}${
      process.env.DOMAIN ? `.${process.env.DOMAIN}` : ""
    }.${process.env.NAME}`,
    schema,
    indexes,
    connection: {
      protocol: process.env.MONGODB_PROTOCOL,
      user: process.env.MONGODB_USER,
      password:
        process.env.NODE_ENV == "local"
          ? process.env.MONGODB_USER_PASSWORD
          : await deps.secret("mongodb-view-store"),
      host: process.env.MONGODB_HOST,
      database: process.env.MONGODB_DATABASE,
      parameters: { authSource: "admin", retryWrites: true, w: "majority" },
      autoIndex: true
    }
  });
  return _viewStore;
};

module.exports = async ({ schema, indexes, getFn, /*postFn,*/ putFn } = {}) => {
  const formattedSchema = {
    body: schema,
    headers: {
      root: { type: String, required: true, unique: true },
      [process.env.CONTEXT]: {
        root: String,
        service: String,
        network: String
      },
      ...(process.env.DOMAIN && {
        [process.env.DOMAIN]: {
          root: String,
          service: String,
          network: String
        }
      }),
      created: {
        type: Date,
        required: true,
        default: deps.dateString
      },
      modified: {
        type: Date,
        required: true,
        default: deps.dateString
      }
    }
  };

  const allIndexes = [
    [{ root: 1 }],
    [
      { [`headers.${process.env.CONTEXT}.root`]: 1 },
      { [`headers.${process.env.CONTEXT}.service`]: 1 },
      { [`headers.${process.env.CONTEXT}.network`]: 1 }
    ],
    ...(process.env.DOMAIN
      ? [
          [
            { [`headers.${process.env.DOMAIN}.root`]: 1 },
            { [`headers.${process.env.DOMAIN}.service`]: 1 },
            { [`headers.${process.env.DOMAIN}.network`]: 1 }
          ]
        ]
      : [])
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
    schema: deps.removeIds({ schema: formattedSchema }),
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

  // const findOneFn = async ({ root }) =>
  //   await deps.db.findOne({
  //     store,
  //     query: {
  //       "headers.root": root
  //     },
  //     options: {
  //       lean: true
  //     }
  //   });

  const writeFn = async ({ root, data }) => {
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
      query: { "headers.root": root },
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

  const removeFn = async query =>
    await deps.db.remove({
      store,
      query
    });

  deps.viewStore({
    streamFn,
    findFn,
    // findOneFn,
    writeFn,
    removeFn,
    ...(getFn && { getFn }),
    // ...(postFn && { postFn }),
    ...(putFn && { putFn })
  });
};
