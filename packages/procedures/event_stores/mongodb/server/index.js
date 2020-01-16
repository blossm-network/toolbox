const logger = require("@blossm/logger");

const deps = require("./deps");

const snapshotStoreName = `${process.env.DOMAIN}.snapshots`;

let _eventStore;
let _snapshotStore;

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
      saved: { type: String, required: true },
      payload: formatSchema(schema),
      headers: {
        root: { type: String, required: true },
        number: { type: Number, required: true },
        topic: { type: String, required: true },
        version: { type: Number, required: true },
        context: { type: Object },
        trace: { type: String },
        created: { type: String, required: true },
        idempotency: { type: String, required: true, unique: true },
        command: {
          type: {
            id: { type: String, required: true },
            action: { type: String, required: true },
            domain: { type: String, required: true },
            service: { type: String, required: true },
            network: { type: String, required: true },
            issued: { type: String, required: true }
          },
          default: null
        }
      }
    },
    indexes: [
      [{ id: 1 }],
      [{ "headers.root": 1 }],
      [{ "headers.root": 1, "headers.number": 1 }],
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
          : await deps.secret("mongodb"),
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
      created: { type: Number, required: true },
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

  deps.eventStore({
    aggregateFn: deps.aggregate({
      eventStore: eStore,
      snapshotStore: sStore,
      handlers
    }),
    saveEventFn: deps.saveEvent({
      eventStore: eStore
    }),
    queryFn: deps.query({
      eventStore: eStore,
      snapshotStore: sStore,
      handlers
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
