const logger = require("@blossm/logger");

const deps = require("./deps");

let _eventStore;
let _snapshotStore;
let _countsStore;
let _blockchainStore;

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
        committed: {
          [typeKey]: Date,
          required: true,
          default: deps.dateString,
        },
        created: { [typeKey]: Date, required: true },
        number: { [typeKey]: Number, required: true },
        root: { [typeKey]: String, required: true },
        idempotency: { [typeKey]: String, required: true, unique: true },
        topic: { [typeKey]: String, required: true },
        payload: schema,
        headers: {
          action: { [typeKey]: String, required: true },
          domain: { [typeKey]: String, required: true },
          service: { [typeKey]: String, required: true },
          network: { [typeKey]: String, required: true },
          version: { [typeKey]: Number, required: true },
          context: { [typeKey]: Object, default: {} },
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
      [{ "data.idempotency": 1 }],
      [{ "data.root": 1 }],
      //Need this in order to query by root and sort by number.
      [{ "data.root": 1, "data.number": 1 }],
      //Can omit root from this because it has its own index and isnt useful for sort.
      [
        {
          "data.created": 1,
          "data.number": 1,
          "data.headers.action": 1,
          // _id: 1,
          // __v: 1,
        },
      ],
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
      hash: { [typeKey]: String, required: true, unique: true },
      previous: { [typeKey]: String, required: true, unique: true },
      public: { [typeKey]: Boolean, required: true },
      data: {
        [typeKey]: [String],
        required: true,
        _id: false,
      },
      count: { [typeKey]: Number, required: true },
      created: { [typeKey]: Date, required: true, default: deps.dateString },
      root: { [typeKey]: String, required: true, unique: true },
      lastEventNumber: { [typeKey]: Number, required: true },
      state: schema,
    },
    typeKey,
    indexes: [
      [{ root: 1 }],
      [{ root: 1, created: -1 }],
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
    logger.info("Thank you existing counts store database.");
    return _countsStore;
  }

  _countsStore = deps.db.store({
    name: `_${process.env.SERVICE}.${process.env.DOMAIN}.counts`,
    schema: {
      root: { [typeKey]: String, required: true, unique: true },
      value: { [typeKey]: Number, required: true, default: 0 },
      updated: { [typeKey]: Date, required: true, default: deps.dateString },
    },
    typeKey,
    indexes: [[{ root: 1 }]],
  });

  return _countsStore;
};

const blockchainStore = async () => {
  if (_blockchainStore != undefined) {
    logger.info("Thank you existing blockchain store database.");
    return _countsStore;
  }

  _blockchainStore = deps.db.store({
    name: `_${process.env.SERVICE}.${process.env.DOMAIN}.blockchain`,
    schema: {
      hash: { [typeKey]: String, required: true },
      previous: { [typeKey]: String, required: true },
      created: { [typeKey]: Date, required: true, default: deps.dateString },
      boundary: { [typeKey]: Date, required: true },
      number: { [typeKey]: Number, required: true, unique: true },
      count: { [typeKey]: Number, required: true },
      data: {
        [typeKey]: Object,
        required: true,
      },
      domain: { [typeKey]: String, required: true },
      service: { [typeKey]: String, required: true },
      network: { [typeKey]: String, required: true },
    },
    typeKey,
    indexes: [[{ number: 1 }], [{ hash: 1 }], [{ previous: 1 }]],
  });

  return _blockchainStore;
};

module.exports = async ({
  schema,
  indexes = [],
  handlers,
  secretFn,
  publishFn,
  hashFn,
  public,
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
  const bStore = await blockchainStore();

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
    idempotencyConflictCheckFn: deps.idempotencyConflictCheck({
      eventStore: eStore,
    }),
    createTransactionFn: deps.createTransaction,
    saveSnapshotFn: deps.saveSnapshot({
      snapshotStore: sStore,
    }),
    saveBlockFn: deps.saveBlock({
      blockchainStore: bStore,
    }),
    latestBlockFn: deps.latestBlock({
      blockchainStore: bStore,
    }),
    publishFn,
    hashFn,
    public,
  });
};
