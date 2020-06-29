const logger = require("@blossm/logger");

const deps = require("./deps");

let _viewStore;

const formatTypesInSchema = (schema) => {
  const newSchema = {};
  for (const property in schema) {
    newSchema[property] =
      typeof schema[property] != "object"
        ? schema[property]
        : schema[property] instanceof Array
        ? {
            $type: schema[property].map((obj) =>
              typeof obj != "object"
                ? obj
                : obj.type != undefined && typeof obj.type != "object"
                ? {
                    ...obj,
                    $type: obj.type,
                  }
                : {
                    ...obj,
                    ...(obj.type != undefined &&
                      obj.type.type != undefined && {
                        type: {
                          $type: obj.type.type,
                        },
                      }),
                  }
            ),
          }
        : schema[property].type != undefined &&
          typeof schema[property].type != "object"
        ? {
            ...schema[property],
            $type: schema[property].type,
          }
        : schema[property].type instanceof Array
        ? {
            //same as map above
            $type: schema[property].type.map((obj) =>
              typeof obj != "object"
                ? obj
                : obj.type != undefined && typeof obj.type != "object"
                ? {
                    ...obj,
                    $type: obj.type,
                  }
                : {
                    ...obj,
                    ...(obj.type != undefined &&
                      obj.type.type != undefined && {
                        type: {
                          $type: obj.type.type,
                        },
                      }),
                  }
            ),
          }
        : {
            $type: {
              ...schema[property],
              ...(schema[property].type != undefined &&
                schema[property].type.type != undefined && {
                  type: {
                    $type: schema[property].type.type,
                  },
                }),
            },
          };

    delete newSchema[property].type;
  }
  return newSchema;
};

const viewStore = async ({ schema, indexes }) => {
  if (_viewStore != undefined) {
    logger.info("Thank you existing database.");
    return _viewStore;
  }

  _viewStore = deps.db.store({
    name: `_${process.env.CONTEXT}${
      process.env.SERVICE ? `.${process.env.SERVICE}` : ""
    }${process.env.DOMAIN ? `.${process.env.DOMAIN}` : ""}.${process.env.NAME}`,
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
      autoIndex: true,
    },
  });
  return _viewStore;
};

module.exports = async ({ schema, indexes, getFn, putFn, one } = {}) => {
  const formattedSchema = {
    body: deps.removeIds({ schema: formatTypesInSchema(schema) }),
    headers: {
      root: { $type: String, required: true, unique: true },
      trace: { $type: String },
      [process.env.CONTEXT]: {
        $type: {
          root: String,
          service: String,
          network: String,
          _id: false,
        },
      },
      ...(process.env.DOMAIN && {
        [process.env.DOMAIN]: {
          $type: {
            root: String,
            service: String,
            network: String,
            _id: false,
          },
        },
      }),
      created: {
        $type: Date,
        required: true,
        default: deps.dateString,
      },
      modified: {
        $type: Date,
        required: true,
        default: deps.dateString,
      },
      _id: false,
    },
  };

  const allIndexes = [
    [{ root: 1 }],
    [
      { [`headers.${process.env.CONTEXT}.root`]: 1 },
      { [`headers.${process.env.CONTEXT}.service`]: 1 },
      { [`headers.${process.env.CONTEXT}.network`]: 1 },
    ],
    ...(process.env.DOMAIN
      ? [
          [
            { [`headers.${process.env.DOMAIN}.root`]: 1 },
            { [`headers.${process.env.DOMAIN}.service`]: 1 },
            { [`headers.${process.env.DOMAIN}.network`]: 1 },
          ],
        ]
      : []),
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
    schema: formattedSchema,
    indexes: allIndexes,
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

  const writeFn = async ({ root, data }) => {
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
