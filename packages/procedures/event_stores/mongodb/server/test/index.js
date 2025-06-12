const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, stub, useFakeTimers } = require("sinon");

const deps = require("../deps");

let clock;

const now = new Date();

const domain = "some-domain";
const service = "some-service";
const user = "some-db-user";
const protocol = "some-db-protocol";
const userPassword = "some-db-user-password";
const host = "some-host";
const database = "some-db";
const password = "some-password";
const handlers = "some-handlers";
const encryptFn = "some-encrypt-fn";
const createBlockFn = "some-create-block-fn";
const signFn = "some-sign-fn";
const blockPublisherPublicKeyFn = "some-block-publisher-public-key-fn";
const isPublic = "some-public";

process.env.DOMAIN = domain;
process.env.SERVICE = service;
process.env.MONGODB_PROTOCOL = protocol;
process.env.MONGODB_USER = user;
process.env.MONGODB_USER_PASSWORD = userPassword;
process.env.MONGODB_HOST = host;
process.env.MONGODB_DATABASE = database;

const publishFn = "some-publish-fn";

describe("Mongodb event store", () => {
  beforeEach(() => {
    delete require.cache[require.resolve("..")];
    process.env.NODE_ENV = "some-env";
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should call with the correct params", async () => {
    const mongodbEventStore = require("..");
    const eStore = "some-event-store";
    const sStore = "some-snapshot-store";
    const cStore = "some-counts-store";
    const bStore = "some-blockchain-store";
    const storeFake = stub()
      .onCall(0)
      .returns(eStore)
      .onCall(1)
      .returns(sStore)
      .onCall(2)
      .returns(cStore)
      .onCall(3)
      .returns(bStore);

    const secretFake = fake.returns(password);

    const eventStoreFake = fake();
    replace(deps, "eventStore", eventStoreFake);

    const startTransactionFake = fake();
    const transaction = { startTransaction: startTransactionFake };
    const startSessionFake = fake.returns(transaction);
    const db = {
      store: storeFake,
      startSession: startSessionFake,
    };
    replace(deps, "db", db);

    const saveEventsResult = "some-save-events-result";
    const saveEventsFake = fake.returns(saveEventsResult);
    replace(deps, "saveEvents", saveEventsFake);
    const reserveRootCountsResult = "some-reserve-root-count-result";
    const reserveRootCountsFake = fake.returns(reserveRootCountsResult);
    replace(deps, "reserveRootCounts", reserveRootCountsFake);
    const rootStreamResult = "some-root-stream-result";
    const rootStreamFake = fake.returns(rootStreamResult);
    replace(deps, "rootStream", rootStreamFake);
    const countResult = "some-count-result";
    const countFake = fake.returns(countResult);
    replace(deps, "count", countFake);
    const findSnapshotsResult = "some-find-snapshots-result";
    const findSnapshotsFake = fake.returns(findSnapshotsResult);
    replace(deps, "findSnapshots", findSnapshotsFake);
    const findOneSnapshotResult = "some-find-one-snapshots-result";
    const findOneSnapshotFake = fake.returns(findOneSnapshotResult);
    replace(deps, "findOneSnapshot", findOneSnapshotFake);
    const findEventsResult = "some-find-events-result";
    const findEventsFake = fake.returns(findEventsResult);
    replace(deps, "findEvents", findEventsFake);
    const eventStreamResult = "some-event-stream-result";
    const eventStreamFake = fake.returns(eventStreamResult);
    replace(deps, "eventStream", eventStreamFake);
    const queryResult = "some-query-result";
    const queryFake = fake.returns(queryResult);
    replace(deps, "query", queryFake);
    const idempotencyConflictCheckResult =
      "some-idempotency-conflict-check-result";
    const idempotencyConflictCheckFake = fake.returns(
      idempotencyConflictCheckResult
    );
    replace(deps, "idempotencyConflictCheck", idempotencyConflictCheckFake);
    const saveBlockFnResult = "some-save-block-result";
    const saveBlockFake = fake.returns(saveBlockFnResult);
    replace(deps, "saveBlock", saveBlockFake);
    const saveSnapshotFnResult = "some-save-snapshot-result";
    const saveSnapshotFake = fake.returns(saveSnapshotFnResult);
    replace(deps, "saveSnapshot", saveSnapshotFake);
    const latestBlockResult = "some-latest-block-result";
    const latestBlockFake = fake.returns(latestBlockResult);
    replace(deps, "latestBlock", latestBlockFake);

    const formattedSchemaWithOptions = "some-formatted-schema-with-options";
    const formattedSchema = "some-formatted-schema";
    const formatSchemaFake = stub()
      .onFirstCall()
      .returns(formattedSchemaWithOptions)
      .returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    const schema = { a: String };
    await mongodbEventStore({
      schema,
      handlers,
      secretFn: secretFake,
      publishFn,
      encryptFn,
      createBlockFn,
      signFn,
      blockPublisherPublicKeyFn,
      isPublic,
    });

    expect(formatSchemaFake.getCall(0)).to.have.been.calledWith(
      schema,
      "$type",
      {
        options: {
          required: false,
          unique: false,
          default: undefined,
        },
      }
    );
    expect(formatSchemaFake.getCall(1)).to.have.been.calledWith(
      schema,
      "$type",
      {
        options: {
          default: undefined,
          unique: false,
        },
      }
    );
    expect(storeFake.getCall(0)).to.have.been.calledWith({
      name: `events`,
      schema: {
        hash: { $type: String, required: true, unique: true },
        headers: {
          nonce: {
            $type: String,
            required: true,
            unique: true,
          },
          pHash: { $type: String, required: true },
          cHash: { $type: String, required: true },
          gaHash: { $type: String },
          grHash: { $type: String },
          tHash: { $type: String, required: true },
          committed: {
            $type: Date,
            required: true,
          },
          created: { $type: Date, required: true },
          number: { $type: Number, required: true },
          root: { $type: String, required: true },
          topic: { $type: String, required: true },
          idempotency: { $type: String, required: true, unique: true },
          action: { $type: String, required: true },
          domain: { $type: String, required: true },
          service: { $type: String, required: true },
          network: { $type: String, required: true },
          version: { $type: Number, required: true },
          _id: false,
        },
        context: { $type: Object },
        groupsAdded: {
          $type: [
            {
              root: { $type: String },
              service: { $type: String },
              network: { $type: String },
              _id: false,
            },
          ],
          default: undefined,
        },
        groupsRemoved: {
          $type: [
            {
              root: { $type: String },
              service: { $type: String },
              network: { $type: String },
              _id: false,
            },
          ],
          default: undefined,
        },
        tx: {
          ip: { $type: String },
          id: { $type: String },
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
          path: {
            $type: [
              {
                id: { $type: String },
                name: { $type: String },
                domain: { $type: String },
                service: { $type: String },
                network: { $type: String, required: true },
                host: { $type: String, required: true },
                procedure: { $type: String, required: true },
                hash: { $type: String, required: true },
                issued: { $type: Date },
                timestamp: { $type: Date },
                _id: false,
              },
            ],
          },
          _id: false,
        },
        payload: formattedSchemaWithOptions,
      },
      typeKey: "$type",
      indexes: [
        [{ hash: 1 }],
        [{ "headers.idempotency": 1 }],
        [{ "tx.id": 1 }],
        [{ "headers.root": 1 }],
        [{ "headers.root": 1, "headers.number": 1 }],
        [
          {
            "headers.created": 1,
            "headers.number": 1,
            "headers.action": 1,
          },
        ],
      ],
      connection: {
        protocol,
        user,
        password,
        host,
        database,
        parameters: {
          authSource: "admin",
          retryWrites: true,
          w: "majority",
        },
        autoIndex: true,
      },
    });
    expect(storeFake.getCall(1)).to.have.been.calledWith({
      name: "snapshots",
      schema: {
        hash: { $type: String, required: true, unique: true },
        headers: {
          nonce: {
            $type: String,
            required: true,
            unique: true,
          },
          block: { $type: Number, required: true },
          number: { $type: Number, required: true },
          cHash: { $type: String, required: true },
          gHash: { $type: String, required: true },
          sHash: { $type: String, required: true },
          pHash: { $type: String, required: true },
          created: { $type: Date, required: true },
          root: { $type: String, required: true },
          isPublic: { $type: Boolean, required: true },
          domain: { $type: String, required: true },
          service: { $type: String, required: true },
          network: { $type: String, required: true },
          lastEventNumber: { $type: Number, required: true },
          eCount: { $type: Number, required: true },
          eRoot: { $type: String, required: true },
          eSize: { $type: Number, required: true },
          _id: false,
        },
        context: { $type: Object },
        groups: {
          $type: [
            {
              root: { $type: String },
              service: { $type: String },
              network: { $type: String },
              _id: false,
            },
          ],
        },
        state: formattedSchema,
        events: { $type: Buffer, required: true },
        txIds: { $type: [String] },
      },
      typeKey: "$type",
      indexes: [
        [{ hash: 1 }],
        [{ "headers.root": 1 }],
        [{ "headers.root": 1, "headers.created": -1 }],
      ],
    });
    expect(storeFake.getCall(2)).to.have.been.calledWith({
      name: "counts",
      schema: {
        root: { $type: String, required: true, unique: true },
        value: { $type: Number, required: true, default: 0 },
        updated: { $type: Date, required: true, default: deps.dateString },
      },
      typeKey: "$type",
      indexes: [
        [{ root: 1 }],
        [{ root: 1, updated: 1 }],
        [{ root: 1, updated: -1 }],
      ],
    });
    expect(storeFake.getCall(3)).to.have.been.calledWith({
      name: "blockchain",
      schema: {
        hash: { $type: String, required: true, unique: true },
        signature: { $type: String, required: true },
        headers: {
          pHash: { $type: String, required: true },
          created: { $type: Date, required: true },
          number: { $type: Number, required: true, unique: true },
          start: { $type: Date, required: true },
          end: { $type: Date, required: true },
          eCount: { $type: Number, required: true },
          sCount: { $type: Number, required: true },
          tCount: { $type: Number, required: true },
          eRoot: { $type: String, required: true },
          sRoot: { $type: String, required: true },
          tRoot: { $type: String, required: true },
          eSize: { $type: Number, required: true },
          sSize: { $type: Number, required: true },
          tSize: { $type: Number, required: true },
          domain: { $type: String, required: true },
          service: { $type: String, required: true },
          network: { $type: String, required: true },
          key: { $type: String, required: true },
          _id: false,
        },
        events: { $type: Buffer, required: true },
        txs: { $type: Buffer, required: true },
        snapshots: { $type: Buffer, required: true },
      },
      typeKey: "$type",
      indexes: [[{ "headers.number": 1 }]],
    });
    expect(secretFake).to.have.been.calledWith("mongodb-event-store");

    expect(saveEventsFake).to.have.been.calledWith({
      eventStore: eStore,
      handlers,
    });
    expect(reserveRootCountsFake).to.have.been.calledWith({
      countsStore: cStore,
    });
    expect(rootStreamFake).to.have.been.calledWith({
      countsStore: cStore,
    });
    expect(countFake).to.have.been.calledWith({
      countsStore: cStore,
    });
    expect(findOneSnapshotFake).to.have.been.calledWith({
      snapshotStore: sStore,
    });
    expect(findSnapshotsFake).to.have.been.calledWith({
      snapshotStore: sStore,
    });
    expect(eventStreamFake).to.have.been.calledWith({
      eventStore: eStore,
    });
    expect(findEventsFake).to.have.been.calledWith({
      eventStore: eStore,
    });
    expect(queryFake).to.have.been.calledWith({
      eventStore: eStore,
      snapshotStore: sStore,
      handlers,
    });
    expect(saveBlockFake).to.have.been.calledWith({
      blockchainStore: bStore,
    });
    expect(idempotencyConflictCheckFake).to.have.been.calledWith({
      eventStore: eStore,
    });
    expect(saveSnapshotFake).to.have.been.calledWith({
      snapshotStore: sStore,
    });
    expect(latestBlockFake).to.have.been.calledWith({
      blockchainStore: bStore,
    });
    expect(eventStoreFake).to.have.been.calledWith({
      findOneSnapshotFn: findOneSnapshotResult,
      findSnapshotsFn: findSnapshotsResult,
      eventStreamFn: eventStreamResult,
      findEventsFn: findEventsResult,
      handlers,
      saveEventsFn: saveEventsResult,
      queryFn: queryResult,
      reserveRootCountsFn: reserveRootCountsResult,
      rootStreamFn: rootStreamResult,
      countFn: countResult,
      createTransactionFn: deps.createTransaction,
      publishFn,
      saveBlockFn: saveBlockFnResult,
      saveSnapshotFn: saveSnapshotFnResult,
      latestBlockFn: latestBlockResult,
      signFn,
      encryptFn,
      createBlockFn,
      blockPublisherPublicKeyFn,
      isPublic,
      idempotencyConflictCheckFn: idempotencyConflictCheckResult,
    });

    await mongodbEventStore();
    expect(storeFake).to.have.been.callCount(4);
  });
  it("should call with the correct params with indexes and local env", async () => {
    const mongodbEventStore = require("..");
    const eStore = "some-event-store";
    const sStore = "some-snapshot-store";
    const cStore = "some-counts-store";
    const bStore = "some-blockchain-store";
    const storeFake = stub()
      .onCall(0)
      .returns(eStore)
      .onCall(1)
      .returns(sStore)
      .onCall(2)
      .returns(cStore)
      .onCall(3)
      .returns(bStore);

    const secretFake = fake.returns(password);

    const eventStoreFake = fake();
    replace(deps, "eventStore", eventStoreFake);

    const formattedSchemaWithOptions = "some-formatted-schema-with-options";
    const formattedSchema = "some-formatted-schema";
    const formatSchemaFake = stub()
      .onFirstCall()
      .returns(formattedSchemaWithOptions)
      .returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    const db = {
      store: storeFake,
    };
    replace(deps, "db", db);

    const index = "some-index";
    const saveEventsResult = "some-save-events-result";
    const saveEventsFake = fake.returns(saveEventsResult);
    replace(deps, "saveEvents", saveEventsFake);
    const findSnapshotsResult = "some-find-snapshots-result";
    const findSnapshotsFake = fake.returns(findSnapshotsResult);
    replace(deps, "findSnapshots", findSnapshotsFake);
    const findOneSnapshotResult = "some-find-one-snapshots-result";
    const findOneSnapshotFake = fake.returns(findOneSnapshotResult);
    replace(deps, "findOneSnapshot", findOneSnapshotFake);
    const findEventsResult = "some-find-events-result";
    const findEventsFake = fake.returns(findEventsResult);
    replace(deps, "findEvents", findEventsFake);
    const eventStreamResult = "some-event-stream-result";
    const eventStreamFake = fake.returns(eventStreamResult);
    replace(deps, "eventStream", eventStreamFake);
    const queryResult = "some-query-result";
    const queryFake = fake.returns(queryResult);
    replace(deps, "query", queryFake);
    const idempotencyConflictCheckResult =
      "some-idempotency-conflict-check-result";
    const idempotencyConflictCheckFake = fake.returns(
      idempotencyConflictCheckResult
    );
    replace(deps, "idempotencyConflictCheck", idempotencyConflictCheckFake);
    const reserveRootCountsResult = "some-reserve-root-count-result";
    const reserveRootCountsFake = fake.returns(reserveRootCountsResult);
    replace(deps, "reserveRootCounts", reserveRootCountsFake);
    const rootStreamResult = "some-root-stream-result";
    const rootStreamFake = fake.returns(rootStreamResult);
    replace(deps, "rootStream", rootStreamFake);
    const countResult = "some-count-result";
    const countFake = fake.returns(countResult);
    replace(deps, "count", countFake);
    const saveBlockFnResult = "some-save-block-result";
    const saveBlockFake = fake.returns(saveBlockFnResult);
    replace(deps, "saveBlock", saveBlockFake);
    const saveSnapshotFnResult = "some-save-snapshot-result";
    const saveSnapshotFake = fake.returns(saveSnapshotFnResult);
    replace(deps, "saveSnapshot", saveSnapshotFake);
    const latestBlockResult = "some-latest-block-result";
    const latestBlockFake = fake.returns(latestBlockResult);
    replace(deps, "latestBlock", latestBlockFake);

    process.env.NODE_ENV = "local";

    const schema = { a: String };
    await mongodbEventStore({
      schema,
      indexes: [index],
      secretFn: secretFake,
      publishFn,
      encryptFn,
      createBlockFn,
      signFn,
      blockPublisherPublicKeyFn,
      isPublic,
      handlers,
    });

    expect(formatSchemaFake.getCall(0)).to.have.been.calledWith(
      schema,
      "$type",
      {
        options: {
          required: false,
          unique: false,
          default: undefined,
        },
      }
    );
    expect(formatSchemaFake.getCall(1)).to.have.been.calledWith(
      schema,
      "$type",
      {
        options: {
          default: undefined,
          unique: false,
        },
      }
    );
    expect(storeFake.getCall(0)).to.have.been.calledWith({
      name: "events",
      schema: {
        hash: { $type: String, required: true, unique: true },
        headers: {
          nonce: {
            $type: String,
            required: true,
            unique: true,
          },
          pHash: { $type: String, required: true },
          cHash: { $type: String, required: true },
          gaHash: { $type: String },
          grHash: { $type: String },
          tHash: { $type: String, required: true },
          committed: {
            $type: Date,
            required: true,
          },
          created: { $type: Date, required: true },
          number: { $type: Number, required: true },
          root: { $type: String, required: true },
          topic: { $type: String, required: true },
          idempotency: { $type: String, required: true, unique: true },
          action: { $type: String, required: true },
          domain: { $type: String, required: true },
          service: { $type: String, required: true },
          network: { $type: String, required: true },
          version: { $type: Number, required: true },
          _id: false,
        },
        context: { $type: Object },
        groupsAdded: {
          $type: [
            {
              root: { $type: String },
              service: { $type: String },
              network: { $type: String },
              _id: false,
            },
          ],
          default: undefined,
        },
        groupsRemoved: {
          $type: [
            {
              root: { $type: String },
              service: { $type: String },
              network: { $type: String },
              _id: false,
            },
          ],
          default: undefined,
        },
        tx: {
          ip: { $type: String },
          id: { $type: String },
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
          path: {
            $type: [
              {
                id: { $type: String },
                name: { $type: String },
                domain: { $type: String },
                service: { $type: String },
                network: { $type: String, required: true },
                host: { $type: String, required: true },
                procedure: { $type: String, required: true },
                hash: { $type: String, required: true },
                issued: { $type: Date },
                timestamp: { $type: Date },
                _id: false,
              },
            ],
          },
          _id: false,
        },
        payload: formattedSchemaWithOptions,
      },
      typeKey: "$type",
      indexes: [
        [{ hash: 1 }],
        [{ "headers.idempotency": 1 }],
        [{ "tx.id": 1 }],
        [{ "headers.root": 1 }],
        [{ "headers.root": 1, "headers.number": 1 }],
        [
          {
            "headers.created": 1,
            "headers.number": 1,
            "headers.action": 1,
          },
        ],
        [{ [`payload.${index}`]: 1 }],
      ],
      connection: {
        protocol,
        user,
        password: userPassword,
        host,
        database,
        parameters: {
          authSource: "admin",
          retryWrites: true,
          w: "majority",
        },
        autoIndex: true,
      },
    });
    expect(storeFake.getCall(1)).to.have.been.calledWith({
      name: "snapshots",
      schema: {
        hash: { $type: String, required: true, unique: true },
        headers: {
          nonce: {
            $type: String,
            required: true,
            unique: true,
          },
          block: { $type: Number, required: true },
          number: { $type: Number, required: true },
          cHash: { $type: String, required: true },
          gHash: { $type: String, required: true },
          sHash: { $type: String, required: true },
          pHash: { $type: String, required: true },
          created: { $type: Date, required: true },
          root: { $type: String, required: true },
          isPublic: { $type: Boolean, required: true },
          domain: { $type: String, required: true },
          service: { $type: String, required: true },
          network: { $type: String, required: true },
          lastEventNumber: { $type: Number, required: true },
          eCount: { $type: Number, required: true },
          eRoot: { $type: String, required: true },
          eSize: { $type: Number, required: true },
          _id: false,
        },
        context: { $type: Object },
        groups: {
          $type: [
            {
              root: { $type: String },
              service: { $type: String },
              network: { $type: String },
              _id: false,
            },
          ],
        },
        state: formattedSchema,
        events: { $type: Buffer, required: true },
        txIds: { $type: [String] },
      },
      typeKey: "$type",
      indexes: [
        [{ hash: 1 }],
        [{ "headers.root": 1 }],
        [{ "headers.root": 1, "headers.created": -1 }],
        [{ [`state.${index}`]: 1 }],
      ],
    });
    expect(storeFake.getCall(2)).to.have.been.calledWith({
      name: "counts",
      schema: {
        root: { $type: String, required: true, unique: true },
        value: { $type: Number, required: true, default: 0 },
        updated: { $type: Date, required: true, default: deps.dateString },
      },
      typeKey: "$type",
      indexes: [
        [{ root: 1 }],
        [{ root: 1, updated: 1 }],
        [{ root: 1, updated: -1 }],
      ],
    });
    expect(storeFake.getCall(3)).to.have.been.calledWith({
      name: "blockchain",
      schema: {
        hash: { $type: String, required: true, unique: true },
        signature: { $type: String, required: true },
        headers: {
          pHash: { $type: String, required: true },
          created: { $type: Date, required: true },
          number: { $type: Number, required: true, unique: true },
          start: { $type: Date, required: true },
          end: { $type: Date, required: true },
          eCount: { $type: Number, required: true },
          sCount: { $type: Number, required: true },
          tCount: { $type: Number, required: true },
          eRoot: { $type: String, required: true },
          sRoot: { $type: String, required: true },
          tRoot: { $type: String, required: true },
          eSize: { $type: Number, required: true },
          sSize: { $type: Number, required: true },
          tSize: { $type: Number, required: true },
          domain: { $type: String, required: true },
          service: { $type: String, required: true },
          network: { $type: String, required: true },
          key: { $type: String, required: true },
          _id: false,
        },
        events: { $type: Buffer, required: true },
        snapshots: { $type: Buffer, required: true },
        txs: { $type: Buffer, required: true },
      },
      typeKey: "$type",
      indexes: [[{ "headers.number": 1 }]],
    });
    expect(eventStoreFake).to.have.been.calledWith({
      findOneSnapshotFn: findOneSnapshotResult,
      findSnapshotsFn: findSnapshotsResult,
      eventStreamFn: eventStreamResult,
      findEventsFn: findEventsResult,
      saveEventsFn: saveEventsResult,
      handlers,
      queryFn: queryResult,
      reserveRootCountsFn: reserveRootCountsResult,
      rootStreamFn: rootStreamResult,
      countFn: countResult,
      publishFn,
      idempotencyConflictCheckFn: idempotencyConflictCheckResult,
      saveBlockFn: saveBlockFnResult,
      saveSnapshotFn: saveSnapshotFnResult,
      latestBlockFn: latestBlockResult,
      signFn,
      encryptFn,
      createBlockFn,
      blockPublisherPublicKeyFn,
      isPublic,
      createTransactionFn: deps.createTransaction,
    });
  });
  it("should call with the correct params when schema has object property", async () => {
    const mongodbEventStore = require("..");
    const eStore = "some-event-store";
    const sStore = "some-snapshot-store";
    const cStore = "some-counts-store";
    const bStore = "some-blockchain-store";
    const storeFake = stub()
      .onCall(0)
      .returns(eStore)
      .onCall(1)
      .returns(sStore)
      .onCall(2)
      .returns(cStore)
      .onCall(3)
      .returns(bStore);

    const secretFake = fake.returns(password);

    const eventStoreFake = fake();
    replace(deps, "eventStore", eventStoreFake);

    const formattedSchemaWithOptions = "some-formatted-schema-with-options";
    const formattedSchema = "some-formatted-schema";
    const formatSchemaFake = stub()
      .onFirstCall()
      .returns(formattedSchemaWithOptions)
      .returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    const db = {
      store: storeFake,
    };
    replace(deps, "db", db);

    const saveEventsResult = "some-save-event-result";
    const saveEventsFake = fake.returns(saveEventsResult);
    replace(deps, "saveEvents", saveEventsFake);
    const findSnapshotsResult = "some-find-snapshots-result";
    const findSnapshotsFake = fake.returns(findSnapshotsResult);
    replace(deps, "findSnapshots", findSnapshotsFake);
    const findOneSnapshotResult = "some-find-one-snapshots-result";
    const findOneSnapshotFake = fake.returns(findOneSnapshotResult);
    replace(deps, "findOneSnapshot", findOneSnapshotFake);
    const findEventsResult = "some-find-events-result";
    const findEventsFake = fake.returns(findEventsResult);
    replace(deps, "findEvents", findEventsFake);
    const eventStreamResult = "some-event-stream-result";
    const eventStreamFake = fake.returns(eventStreamResult);
    replace(deps, "eventStream", eventStreamFake);
    const queryResult = "some-query-result";
    const queryFake = fake.returns(queryResult);
    replace(deps, "query", queryFake);
    const idempotencyConflictCheckResult =
      "some-idempotency-conflict-check-result";
    const idempotencyConflictCheckFake = fake.returns(
      idempotencyConflictCheckResult
    );
    replace(deps, "idempotencyConflictCheck", idempotencyConflictCheckFake);
    const saveBlockFnResult = "some-save-block-result";
    const saveBlockFake = fake.returns(saveBlockFnResult);
    replace(deps, "saveBlock", saveBlockFake);
    const saveSnapshotFnResult = "some-save-snapshot-result";
    const saveSnapshotFake = fake.returns(saveSnapshotFnResult);
    replace(deps, "saveSnapshot", saveSnapshotFake);
    const latestBlockResult = "some-latest-block-result";
    const latestBlockFake = fake.returns(latestBlockResult);
    replace(deps, "latestBlock", latestBlockFake);

    const schema = { a: { type: String } };
    await mongodbEventStore({
      schema,
      handlers,
      secretFn: secretFake,
      publishFn,
      encryptFn,
      createBlockFn,
      signFn,
      blockPublisherPublicKeyFn,
      isPublic,
    });

    expect(formatSchemaFake.getCall(0)).to.have.been.calledWith(
      schema,
      "$type",
      {
        options: {
          required: false,
          unique: false,
          default: undefined,
        },
      }
    );
    expect(formatSchemaFake.getCall(1)).to.have.been.calledWith(
      schema,
      "$type",
      {
        options: {
          default: undefined,
          unique: false,
        },
      }
    );
    expect(storeFake.getCall(0)).to.have.been.calledWith({
      name: "events",
      schema: {
        hash: { $type: String, required: true, unique: true },
        headers: {
          nonce: {
            $type: String,
            required: true,
            unique: true,
          },
          pHash: { $type: String, required: true },
          cHash: { $type: String, required: true },
          gaHash: { $type: String },
          grHash: { $type: String },
          tHash: { $type: String, required: true },
          committed: {
            $type: Date,
            required: true,
          },
          created: { $type: Date, required: true },
          number: { $type: Number, required: true },
          root: { $type: String, required: true },
          topic: { $type: String, required: true },
          idempotency: { $type: String, required: true, unique: true },
          action: { $type: String, required: true },
          domain: { $type: String, required: true },
          service: { $type: String, required: true },
          network: { $type: String, required: true },
          version: { $type: Number, required: true },
          _id: false,
        },
        context: { $type: Object },
        groupsAdded: {
          $type: [
            {
              root: { $type: String },
              service: { $type: String },
              network: { $type: String },
              _id: false,
            },
          ],
          default: undefined,
        },
        groupsRemoved: {
          $type: [
            {
              root: { $type: String },
              service: { $type: String },
              network: { $type: String },
              _id: false,
            },
          ],
          default: undefined,
        },
        tx: {
          ip: { $type: String },
          id: { $type: String },
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
          path: {
            $type: [
              {
                id: { $type: String },
                name: { $type: String },
                domain: { $type: String },
                service: { $type: String },
                network: { $type: String, required: true },
                host: { $type: String, required: true },
                procedure: { $type: String, required: true },
                hash: { $type: String, required: true },
                issued: { $type: Date },
                timestamp: { $type: Date },
                _id: false,
              },
            ],
          },
          _id: false,
        },
        payload: formattedSchemaWithOptions,
      },
      typeKey: "$type",
      indexes: [
        [{ hash: 1 }],
        [{ "headers.idempotency": 1 }],
        [{ "tx.id": 1 }],
        [{ "headers.root": 1 }],
        [{ "headers.root": 1, "headers.number": 1 }],
        [
          {
            "headers.created": 1,
            "headers.number": 1,
            "headers.action": 1,
          },
        ],
      ],
      connection: {
        protocol,
        user,
        password,
        host,
        database,
        parameters: {
          authSource: "admin",
          retryWrites: true,
          w: "majority",
        },
        autoIndex: true,
      },
    });
    expect(storeFake.getCall(1)).to.have.been.calledWith({
      name: "snapshots",
      schema: {
        hash: { $type: String, required: true, unique: true },
        headers: {
          nonce: {
            $type: String,
            required: true,
            unique: true,
          },
          block: { $type: Number, required: true },
          number: { $type: Number, required: true },
          cHash: { $type: String, required: true },
          gHash: { $type: String, required: true },
          sHash: { $type: String, required: true },
          pHash: { $type: String, required: true },
          created: { $type: Date, required: true },
          root: { $type: String, required: true },
          isPublic: { $type: Boolean, required: true },
          domain: { $type: String, required: true },
          service: { $type: String, required: true },
          network: { $type: String, required: true },
          lastEventNumber: { $type: Number, required: true },
          eCount: { $type: Number, required: true },
          eRoot: { $type: String, required: true },
          eSize: { $type: Number, required: true },
          _id: false,
        },
        context: { $type: Object },
        groups: {
          $type: [
            {
              root: { $type: String },
              service: { $type: String },
              network: { $type: String },
              _id: false,
            },
          ],
        },
        state: formattedSchema,
        events: { $type: Buffer, required: true },
        txIds: { $type: [String] },
      },
      typeKey: "$type",
      indexes: [
        [{ hash: 1 }],
        [{ "headers.root": 1 }],
        [{ "headers.root": 1, "headers.created": -1 }],
      ],
    });
    expect(storeFake.getCall(2)).to.have.been.calledWith({
      name: "counts",
      schema: {
        root: { $type: String, required: true, unique: true },
        value: { $type: Number, required: true, default: 0 },
        updated: { $type: Date, required: true, default: deps.dateString },
      },
      typeKey: "$type",
      indexes: [
        [{ root: 1 }],
        [{ root: 1, updated: 1 }],
        [{ root: 1, updated: -1 }],
      ],
    });
    expect(storeFake.getCall(3)).to.have.been.calledWith({
      name: "blockchain",
      schema: {
        hash: { $type: String, required: true, unique: true },
        signature: { $type: String, required: true },
        headers: {
          pHash: { $type: String, required: true },
          created: { $type: Date, required: true },
          number: { $type: Number, required: true, unique: true },
          start: { $type: Date, required: true },
          end: { $type: Date, required: true },
          eCount: { $type: Number, required: true },
          sCount: { $type: Number, required: true },
          tCount: { $type: Number, required: true },
          eRoot: { $type: String, required: true },
          sRoot: { $type: String, required: true },
          tRoot: { $type: String, required: true },
          eSize: { $type: Number, required: true },
          sSize: { $type: Number, required: true },
          tSize: { $type: Number, required: true },
          domain: { $type: String, required: true },
          service: { $type: String, required: true },
          network: { $type: String, required: true },
          key: { $type: String, required: true },
          _id: false,
        },
        events: { $type: Buffer, required: true },
        txs: { $type: Buffer, required: true },
        snapshots: { $type: Buffer, required: true },
      },
      typeKey: "$type",
      indexes: [[{ "headers.number": 1 }]],
    });
  });
});
