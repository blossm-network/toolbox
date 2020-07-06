const logger = require("@blossm/logger");

const deps = require("./deps");

let _eventStore;
let _snapshotStore;
let _countsStore;

const typeKey = "$type";

const eventStore = async ({ schema, indexes, secretFn }) => {
  if (_eventStore != undefined) {
    logger.info("Thank you existing event store database.");
    return _eventStore;
  }

  _eventStore = deps.db.store({
    name: `_${process.env.SERVICE}.${process.env.DOMAIN}`,
    schema: {
      hash: { [typeKey]: String, required: true, unique: true },
      data: {
        id: { [typeKey]: String, required: true, unique: true },
        saved: { [typeKey]: Date, required: true },
        number: { [typeKey]: Number, required: true },
        root: { [typeKey]: String, required: true },
        payload: schema,
        headers: {
          topic: { [typeKey]: String, required: true },
          action: { [typeKey]: String, required: true },
          domain: { [typeKey]: String, required: true },
          service: { [typeKey]: String, required: true },
          version: { [typeKey]: Number, required: true },
          context: { [typeKey]: Object },
          claims: {
            [typeKey]: {
              iss: String,
              aud: String,
              sub: String,
              exp: String,
              iat: String,
              jti: String,
              _id: false,
            },
          },
          trace: { [typeKey]: String },
          created: { [typeKey]: Date, required: true },
          idempotency: { [typeKey]: String, required: true, unique: true },
          path: {
            [typeKey]: [
              {
                name: { [typeKey]: String },
                id: { [typeKey]: String },
                domain: { [typeKey]: String },
                service: { [typeKey]: String },
                network: { [typeKey]: String, required: true },
                host: { [typeKey]: String, required: true },
                procedure: { [typeKey]: String, required: true },
                hash: { [typeKey]: String, required: true },
                issued: { [typeKey]: Date },
                timestamp: { [typeKey]: Date },
                _id: false,
              },
            ],
            default: [],
          },
          _id: false,
        },
        _id: false,
      },
    },
    typeKey,
    indexes: [
      [{ "data.id": 1 }],
      [{ "data.root": 1 }],
      [{ "data.root": 1, "data.number": 1, _id: 1, __v: 1 }],
      ...(indexes.length == 0
        ? []
        : [
            indexes.map((index) => {
              return { [`data.payload.${index}`]: 1 };
            }),
          ]),
    ],
    connection: {
      protocol: process.env.MONGODB_PROTOCOL,
      user: process.env.MONGODB_USER,
      password:
        process.env.NODE_ENV == "local"
          ? process.env.MONGODB_USER_PASSWORD
          : await secretFn("mongodb-event-store"),
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
      created: { [typeKey]: Date, required: true },
      root: { [typeKey]: String, required: true, unique: true },
      lastEventNumber: { [typeKey]: Number, required: true },
      state: schema,
    },
    typeKey,
    indexes: [
      [{ root: 1 }],
      ...(indexes.length == 0
        ? []
        : [
            indexes.map((index) => {
              return { [`state.${index}`]: 1 };
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
      root: { [typeKey]: String, required: true, unique: true },
      value: { [typeKey]: Number, required: true, default: 0 },
    },
    typeKey,
    indexes: [[{ root: 1 }]],
  });

  return _countsStore;
};

module.exports = async ({
  schema,
  indexes = [],
  handlers,
  secretFn,
  publishFn,
  hashFn,
  // archiveSnapshotFn,
  // archiveEventsFn
} = {}) => {
  const eStore = await eventStore({
    schema: deps.formatSchema(schema, typeKey, {
      options: {
        required: false,
        unique: false,
        default: undefined,
      },
    }),
    indexes,
    secretFn,
  });
  const sStore = await snapshotStore({
    schema: deps.formatSchema(schema, typeKey),
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
    hashFn,
  });
};

// const saveSnapshotFn = async snapshot => {
//   const savedSnapshot = await deps.db.write({
//     store: sStore,
//     query: { "root": snapshot.root },
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
//       root: savedSnapshot.root,
//       snapshot: savedSnapshot
//     }),
//     cleanOldEvents({
//       root: savedSnapshot.root,
//       number: savedSnapshot.headers.lastEventNumber
//     })
//   ]);
// };

// const cleanOldEvents = async ({ root, number }) => {
//   const query = {
//     "root": root,
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
