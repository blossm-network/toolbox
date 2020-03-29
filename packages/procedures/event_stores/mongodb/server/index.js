const logger = require("@blossm/logger");

const deps = require("./deps");

const snapshotStoreName = `${process.env.DOMAIN}.snapshots`;
const countStoreName = `${process.env.DOMAIN}.counts`;

let _eventStore;
let _snapshotStore;
let _countStore;

//make all properties not required since events may
//not contain the full schema.
const formatSchema = schema => {
  const newSchema = {};
  for (const property in schema) {
    newSchema[property] =
      typeof schema[property] == "object" && schema[property].type != undefined
        ? schema[property]
        : {
            type: schema[property]
          };
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

  _eventStore = deps.db.store({
    name: `${process.env.DOMAIN}`,
    schema: {
      id: { type: String, required: true, unique: true },
      saved: { type: Date, required: true },
      payload: formatSchema(schema),
      headers: {
        root: { type: String, required: true },
        number: { type: Number, required: true },
        topic: { type: String, required: true },
        action: { type: String, required: true },
        domain: { type: String, required: true },
        service: { type: String, required: true },
        version: { type: Number, required: true },
        context: { type: Object },
        claims: {
          type: {
            iss: String,
            aud: String,
            sub: String,
            exp: String,
            iat: String,
            jti: String
          }
        },
        trace: { type: String },
        created: { type: Date, required: true },
        idempotency: { type: String, required: true, unique: true },
        command: {
          type: {
            id: { type: String, required: true },
            name: { type: String, required: true },
            domain: { type: String, required: true },
            service: { type: String, required: true },
            network: { type: String, required: true },
            issued: { type: Date, required: true },
            accepted: { type: Date, required: true },
            broadcasted: { type: Date }
          },
          default: null
        }
      }
    },
    indexes: [
      [{ id: 1 }],
      [{ "headers.root": 1 }],
      [{ "headers.root": 1, "headers.number": 1, _id: 1, __v: 1 }],
      ...(indexes.length == 0
        ? []
        : [
            indexes.map(index => {
              return { [index]: 1 };
            })
          ])
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
      autoIndex: true
    }
  });

  return _eventStore;
};

const snapshotStore = async ({ schema, indexes }) => {
  if (_snapshotStore != undefined) {
    logger.info("Thank you existing snapshot store database.");
    return _snapshotStore;
  }

  _snapshotStore = deps.db.store({
    name: snapshotStoreName,
    schema: {
      created: { type: Date, required: true },
      headers: {
        root: { type: String, required: true, unique: true },
        lastEventNumber: { type: Number, required: true }
      },
      state: schema
    },
    indexes: [
      [{ "headers.root": 1 }],
      ...(indexes.length == 0
        ? []
        : [
            indexes.map(index => {
              return { [index]: 1 };
            })
          ])
    ]
  });

  return _snapshotStore;
};

const countStore = async () => {
  if (_countStore != undefined) {
    logger.info("Thank you existing number store database.");
    return _countStore;
  }

  _countStore = deps.db.store({
    name: countStoreName,
    schema: {
      root: { type: String, required: true },
      value: { type: Number, required: true, default: 0 }
    },
    indexes: [[{ root: 1 }]]
  });

  return _countStore;
};

module.exports = async ({
  schema,
  indexes = [],
  handlers,
  publishFn
  // archiveSnapshotFn,
  // archiveEventsFn
} = {}) => {
  const eStore = await eventStore({
    schema: deps.removeIds({ schema }),
    indexes
  });
  const sStore = await snapshotStore({
    schema: deps.removeIds({ schema }),
    indexes
  });
  const cStore = await countStore();

  deps.eventStore({
    aggregateFn: deps.aggregate({
      eventStore: eStore,
      snapshotStore: sStore,
      handlers
    }),
    saveEventsFn: deps.saveEvents({
      eventStore: eStore,
      handlers
    }),
    queryFn: deps.query({
      eventStore: eStore,
      snapshotStore: sStore,
      handlers
    }),
    reserveRootCountsFn: deps.reserveRootCounts({
      countsStore: cStore
    }),
    // saveSnapshotFn,
    publishFn
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
