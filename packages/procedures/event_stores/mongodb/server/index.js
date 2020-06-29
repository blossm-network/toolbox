const logger = require("@blossm/logger");

const deps = require("./deps");

let _eventStore;
let _snapshotStore;
let _countsStore;

//make all properties not required since events may
//not contain the full schema.
const formatSchema = (schema) => {
  const newSchema = {};
  for (const property in schema) {
    newSchema[property] =
      schema[property] instanceof Array
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
        : typeof schema[property] == "object" &&
          schema[property].type != undefined &&
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
            $type:
              typeof schema[property] != "object"
                ? schema[property]
                : {
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
    newSchema[property].required = false;
    newSchema[property].unique = false;
    newSchema[property].default = undefined;
  }
  return newSchema;
};

const eventStore = async ({ schema, indexes }) => {
  if (_eventStore != undefined) {
    logger.info("Thank you existing event store database.");
    return _eventStore;
  }

  console.log({
    formatted: formatSchema(schema),
    removeIds: deps.removeIds({ schema: formatSchema(schema) }),
  });
  _eventStore = deps.db.store({
    name: `_${process.env.SERVICE}.${process.env.DOMAIN}`,
    schema: {
      id: { $type: String, required: true, unique: true },
      saved: { $type: Date, required: true },
      payload: deps.removeIds({ schema: formatSchema(schema) }),
      headers: {
        root: { $type: String, required: true },
        number: { $type: Number, required: true },
        topic: { $type: String, required: true },
        action: { $type: String, required: true },
        domain: { $type: String, required: true },
        service: { $type: String, required: true },
        version: { $type: Number, required: true },
        context: { $type: Object },
        claims: {
          $type: {
            iss: String,
            aud: String,
            sub: String,
            exp: String,
            iat: String,
            jti: String,
            _id: false,
          },
        },
        trace: { $type: String },
        created: { $type: Date, required: true },
        idempotency: { $type: String, required: true, unique: true },
        path: {
          $type: [
            {
              name: { $type: String },
              domain: { $type: String },
              service: { $type: String },
              network: { $type: String, required: true },
              host: { $type: String, required: true },
              procedure: { $type: String, required: true },
              hash: { $type: String, required: true },
              issued: { $type: Date },
              _id: false,
            },
          ],
          default: [],
        },
        _id: false,
      },
    },
    indexes: [
      [{ id: 1 }],
      [{ "headers.root": 1 }],
      [{ "headers.root": 1, "headers.number": 1, _id: 1, __v: 1 }],
      ...(indexes.length == 0
        ? []
        : [
            indexes.map((index) => {
              return { [index]: 1 };
            }),
          ]),
    ],
    connection: {
      protocol: process.env.MONGODB_PROTOCOL,
      user: process.env.MONGODB_USER,
      password:
        process.env.NODE_ENV == "local"
          ? process.env.MONGODB_USER_PASSWORD
          : await deps.secret("mongodb-event-store"),
      host: process.env.MONGODB_HOST,
      database: process.env.MONGODB_DATABASE,
      parameters: { authSource: "admin", retryWrites: true, w: "majority" },
      autoIndex: true,
    },
  });

  return _eventStore;
};

const snapshotStore = async ({ schema, indexes }) => {
  if (_snapshotStore != undefined) {
    logger.info("Thank you existing snapshot store database.");
    return _snapshotStore;
  }

  _snapshotStore = deps.db.store({
    name: `_${process.env.SERVICE}.${process.env.DOMAIN}.snapshots`,
    schema: {
      created: { $type: Date, required: true },
      headers: {
        root: { $type: String, required: true, unique: true },
        lastEventNumber: { $type: Number, required: true },
        _id: false,
      },
      state: deps.removeIds({ schema: formatSchema(schema) }),
    },
    indexes: [
      [{ "headers.root": 1 }],
      ...(indexes.length == 0
        ? []
        : [
            indexes.map((index) => {
              return { [index]: 1 };
            }),
          ]),
    ],
  });

  return _snapshotStore;
};

const countsStore = async () => {
  if (_countsStore != undefined) {
    logger.info("Thank you existing count store database.");
    return _countsStore;
  }

  _countsStore = deps.db.store({
    name: `_${process.env.SERVICE}.${process.env.DOMAIN}.counts`,
    schema: {
      root: { $type: String, required: true, unique: true },
      value: { $type: Number, required: true, default: 0 },
    },
    indexes: [[{ root: 1 }]],
  });

  return _countsStore;
};

module.exports = async ({
  schema,
  indexes = [],
  handlers,
  publishFn,
  // archiveSnapshotFn,
  // archiveEventsFn
} = {}) => {
  const eStore = await eventStore({
    schema,
    indexes,
  });
  const sStore = await snapshotStore({
    schema,
    indexes,
  });
  const cStore = await countsStore();

  deps.eventStore({
    aggregateFn: deps.aggregate({
      eventStore: eStore,
      snapshotStore: sStore,
      handlers,
    }),
    saveEventsFn: deps.saveEvents({
      eventStore: eStore,
      handlers,
    }),
    queryFn: deps.query({
      eventStore: eStore,
      snapshotStore: sStore,
      handlers,
    }),
    streamFn: deps.stream({
      eventStore: eStore,
    }),
    reserveRootCountsFn: deps.reserveRootCounts({
      countsStore: cStore,
    }),
    rootStreamFn: deps.rootStream({
      countsStore: cStore,
    }),
    countFn: deps.count({
      countsStore: cStore,
    }),
    // saveSnapshotFn,
    publishFn,
  });
};

// const saveSnapshotFn = async snapshot => {
//   const savedSnapshot = await deps.db.write({
//     store: sStore,
//     query: { "headers.root": snapshot.headers.root },
//     update: {
//       $set: snapshot
//     },
//     options: {
//       lean: true,
//       omitUndefined: true,
//       upsert: true,
//       new: true,
//       runValidators: false,
//       setDefaultsOnInsert: false
//     }
//   });

//   await Promise.all([
//     archiveSnapshotFn({
//       root: savedSnapshot.headers.root,
//       snapshot: savedSnapshot
//     }),
//     cleanOldEvents({
//       root: savedSnapshot.headers.root,
//       number: savedSnapshot.headers.lastEventNumber
//     })
//   ]);
// };

// const cleanOldEvents = async ({ root, number }) => {
//   const query = {
//     "headers.root": root,
//     "headers.number": {
//       $lte: number
//     }
//   };

//   const events = deps.db.find({
//     store: eStore,
//     query,
//     sort: {
//       "headers.number": 1
//     },
//     options: {
//       lean: true
//     }
//   });

//   await archiveEventsFn({ root, events });
//   await deps.db.remove({
//     store: eStore,
//     query
//   });
// };
