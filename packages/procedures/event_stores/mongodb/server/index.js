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
      headers: {
        nonce: {
          [typeKey]: String,
          required: true,
          unique: true,
        },
        pHash: { [typeKey]: String, required: true },
        cHash: { [typeKey]: String, required: true },
        tHash: { [typeKey]: String, required: true },
        committed: {
          [typeKey]: Date,
          required: true,
        },
        created: { [typeKey]: Date, required: true },
        number: { [typeKey]: Number, required: true },
        root: { [typeKey]: String, required: true },
        topic: { [typeKey]: String, required: true },
        idempotency: { [typeKey]: String, required: true, unique: true },
        action: { [typeKey]: String, required: true },
        domain: { [typeKey]: String, required: true },
        service: { [typeKey]: String, required: true },
        network: { [typeKey]: String, required: true },
        version: { [typeKey]: Number, required: true },
        _id: false,
      },
      context: { [typeKey]: Object },
      tx: {
        ip: { [typeKey]: String },
        id: { [typeKey]: String },
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
        },
        _id: false,
      },
      payload: schema,
    },
    typeKey,
    indexes: [
      [{ hash: 1 }],
      [{ "headers.idempotency": 1 }],
      [{ "tx.ip": 1 }],
      [{ "headers.root": 1 }],
      //Need this in order to query by root and sort by number.
      [{ "headers.root": 1, "headers.number": 1 }],
      //Can omit root from this because it has its own index and isnt useful for sort.
      [
        {
          "headers.created": 1,
          "headers.number": 1,
          "headers.action": 1,
        },
      ],
      ...(indexes.length == 0
        ? []
        : [
            indexes.map((index) => {
              return { [`payload.${index}`]: 1 };
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
      hash: { $type: String, required: true, unique: true },
      headers: {
        nonce: {
          $type: String,
          required: true,
          unique: true,
        },
        block: { [typeKey]: Number, required: true },
        cHash: { [typeKey]: String, required: true },
        sHash: { [typeKey]: String, required: true },
        pHash: { [typeKey]: String, required: true },
        created: { [typeKey]: Date, required: true },
        root: { [typeKey]: String, required: true },
        public: { [typeKey]: Boolean, required: true },
        domain: { [typeKey]: String, required: true },
        service: { [typeKey]: String, required: true },
        network: { [typeKey]: String, required: true },
        lastEventNumber: { [typeKey]: Number, required: true },
        eCount: { [typeKey]: Number, required: true },
        eRoot: { [typeKey]: String, required: true },
        _id: false,
      },
      context: { [typeKey]: Object },
      state: schema,
      events: { [typeKey]: Buffer, required: true },
      txIds: { [typeKey]: [String] },
    },
    typeKey,
    indexes: [
      [{ hash: 1 }],
      [{ "headers.root": 1 }],
      [{ "headers.root": 1, "headers.created": -1 }],
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
      hash: { [typeKey]: String, required: true, unique: true },
      signature: { [typeKey]: String, required: true },
      headers: {
        nonce: {
          [typeKey]: String,
          required: true,
          unique: true,
        },
        pHash: { [typeKey]: String, required: true },
        created: { [typeKey]: Date, required: true },
        number: { [typeKey]: Number, required: true, unique: true },
        start: { [typeKey]: Date, required: true },
        end: { [typeKey]: Date, required: true },
        eCount: { [typeKey]: Number, required: true },
        sCount: { [typeKey]: Number, required: true },
        tCount: { [typeKey]: Number, required: true },
        eRoot: { [typeKey]: String, required: true },
        sRoot: { [typeKey]: String, required: true },
        tRoot: { [typeKey]: String, required: true },
        domain: { [typeKey]: String, required: true },
        service: { [typeKey]: String, required: true },
        network: { [typeKey]: String, required: true },
        key: { [typeKey]: String, required: true },
        _id: false,
      },
      events: { [typeKey]: Buffer, required: true },
      txs: { [typeKey]: Buffer, required: true },
      snapshots: { [typeKey]: Buffer, required: true },
    },
    typeKey,
    indexes: [[{ "headers.number": 1 }]],
  });

  return _blockchainStore;
};

module.exports = async ({
  schema,
  indexes = [],
  handlers,
  secretFn,
  publishFn,
  encryptFn,
  signFn,
  blockPublisherPublicKeyFn,
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
    schema: deps.formatSchema(schema, typeKey, {
      options: { default: undefined },
    }),
    indexes,
  });
  const cStore = await countsStore();
  const bStore = await blockchainStore();

  deps.eventStore({
    findSnapshotsFn: deps.findSnapshots({
      snapshotStore: sStore,
    }),
    findEventsFn: deps.findEvents({
      eventStore: eStore,
    }),
    findOneSnapshotFn: deps.findOneSnapshot({
      snapshotStore: sStore,
    }),
    eventStreamFn: deps.eventStream({
      eventStore: eStore,
    }),
    handlers,
    saveEventsFn: deps.saveEvents({
      eventStore: eStore,
      handlers,
    }),
    queryFn: deps.query({
      eventStore: eStore,
      snapshotStore: sStore,
      handlers,
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
    encryptFn,
    signFn,
    blockPublisherPublicKeyFn,
    public,
  });
};
