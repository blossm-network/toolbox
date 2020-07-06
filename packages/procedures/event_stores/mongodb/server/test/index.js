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

process.env.DOMAIN = domain;
process.env.SERVICE = service;
process.env.MONGODB_PROTOCOL = protocol;
process.env.MONGODB_USER = user;
process.env.MONGODB_USER_PASSWORD = userPassword;
process.env.MONGODB_HOST = host;
process.env.MONGODB_DATABASE = database;

const publishFn = "some-publish-fn";
const hashFn = "some-hash-fn";
const proofFn = "some-proof-fn";

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
    const storeFake = stub()
      .onCall(0)
      .returns(eStore)
      .onCall(1)
      .returns(sStore)
      .onCall(2)
      .returns(cStore);

    const secretFake = fake.returns(password);

    const eventStoreFake = fake();
    replace(deps, "eventStore", eventStoreFake);

    const db = {
      store: storeFake,
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
    const aggregateResult = "some-aggregate-result";
    const aggregateFake = fake.returns(aggregateResult);
    replace(deps, "aggregate", aggregateFake);
    const queryResult = "some-query-result";
    const queryFake = fake.returns(queryResult);
    replace(deps, "query", queryFake);
    const streamResult = "some-stream-result";
    const streamFake = fake.returns(streamResult);
    replace(deps, "stream", streamFake);

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
      hashFn,
      proofFn,
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
      "$type"
    );
    expect(storeFake).to.have.been.calledWith({
      name: `_${service}.${domain}`,
      schema: {
        hash: { $type: String, required: true, unique: true },
        proof: {
          id: { $type: String, required: true },
          type: { $type: String, required: true },
        },
        data: {
          id: { $type: String, required: true, unique: true },
          saved: { $type: Date, required: true },
          root: { $type: String, required: true },
          payload: formattedSchemaWithOptions,
          number: { $type: Number, required: true },
          headers: {
            topic: { $type: String, required: true },
            version: { $type: Number, required: true },
            action: { $type: String, required: true },
            domain: { $type: String, required: true },
            service: { $type: String, required: true },
            trace: { $type: String },
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
            created: { $type: Date, required: true },
            idempotency: { $type: String, required: true, unique: true },
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
              default: [],
            },
            _id: false,
          },
          _id: false,
        },
      },
      typeKey: "$type",
      indexes: [
        [{ "data.id": 1 }],
        [{ "data.root": 1 }],
        [{ "data.root": 1, "data.number": 1, _id: 1, __v: 1 }],
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
    expect(storeFake).to.have.been.calledWith({
      name: `_${service}.${domain}.snapshots`,
      schema: {
        created: { $type: Date, required: true },
        root: { $type: String, required: true, unique: true },
        lastEventNumber: { $type: Number, required: true },
        state: formattedSchema,
      },
      typeKey: "$type",
      indexes: [[{ root: 1 }]],
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
    expect(aggregateFake).to.have.been.calledWith({
      eventStore: eStore,
      snapshotStore: sStore,
      handlers,
    });
    expect(queryFake).to.have.been.calledWith({
      eventStore: eStore,
      snapshotStore: sStore,
      handlers,
    });
    expect(streamFake).to.have.been.calledWith({
      eventStore: eStore,
    });
    expect(eventStoreFake).to.have.been.calledWith({
      aggregateFn: aggregateResult,
      saveEventsFn: saveEventsResult,
      queryFn: queryResult,
      streamFn: streamResult,
      reserveRootCountsFn: reserveRootCountsResult,
      rootStreamFn: rootStreamResult,
      countFn: countResult,
      publishFn,
      hashFn,
      proofFn,
    });

    await mongodbEventStore();
    expect(storeFake).to.have.been.calledThrice;
  });
  it("should call with the correct params with indexes and local env", async () => {
    const mongodbEventStore = require("..");
    const eStore = "some-event-store";
    const sStore = "some-snapshot-store";
    const storeFake = stub()
      .onCall(0)
      .returns(eStore)
      .onCall(1)
      .returns(sStore);

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
    const aggregateResult = "some-aggregate-result";
    const aggregateFake = fake.returns(aggregateResult);
    replace(deps, "aggregate", aggregateFake);
    const queryResult = "some-query-result";
    const queryFake = fake.returns(queryResult);
    replace(deps, "query", queryFake);
    const streamResult = "some-stream-result";
    const streamFake = fake.returns(streamResult);
    replace(deps, "stream", streamFake);

    process.env.NODE_ENV = "local";

    const schema = { a: String };
    await mongodbEventStore({
      schema,
      indexes: [index],
      secretFn: secretFake,
      publishFn,
      hashFn,
      proofFn,
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
      "$type"
    );
    expect(storeFake).to.have.been.calledWith({
      name: `_${service}.${domain}`,
      schema: {
        hash: { $type: String, required: true, unique: true },
        proof: {
          id: { $type: String, required: true },
          type: { $type: String, required: true },
        },
        data: {
          id: { $type: String, required: true, unique: true },
          saved: { $type: Date, required: true },
          payload: formattedSchemaWithOptions,
          root: { $type: String, required: true },
          number: { $type: Number, required: true },
          headers: {
            topic: { $type: String, required: true },
            version: { $type: Number, required: true },
            action: { $type: String, required: true },
            domain: { $type: String, required: true },
            service: { $type: String, required: true },
            trace: { $type: String },
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
            created: { $type: Date, required: true },
            idempotency: { $type: String, required: true, unique: true },
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
              default: [],
            },
            _id: false,
          },
          _id: false,
        },
      },
      typeKey: "$type",
      indexes: [
        [{ "data.id": 1 }],
        [{ "data.root": 1 }],
        [{ "data.root": 1, "data.number": 1, _id: 1, __v: 1 }],
        [{ [`data.payload.${index}`]: 1 }],
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
    expect(storeFake).to.have.been.calledWith({
      name: `_${service}.${domain}.snapshots`,
      schema: {
        created: { $type: Date, required: true },
        root: { $type: String, required: true, unique: true },
        lastEventNumber: { $type: Number, required: true },
        state: formattedSchema,
      },
      typeKey: "$type",
      indexes: [[{ root: 1 }], [{ [`state.${index}`]: 1 }]],
    });
    expect(storeFake).to.have.been.calledWith({
      name: `_${service}.${domain}.counts`,
      schema: {
        root: { $type: String, required: true, unique: true },
        value: { $type: Number, required: true, default: 0 },
      },
      typeKey: "$type",
      indexes: [[{ root: 1 }]],
    });
  });
  it("should call with the correct params when schema has object property", async () => {
    const mongodbEventStore = require("..");
    const eStore = "some-event-store";
    const sStore = "some-snapshot-store";
    const storeFake = stub()
      .onCall(0)
      .returns(eStore)
      .onCall(1)
      .returns(sStore);

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
    const aggregateResult = "some-aggregate-result";
    const aggregateFake = fake.returns(aggregateResult);
    replace(deps, "aggregate", aggregateFake);
    const queryResult = "some-query-result";
    const queryFake = fake.returns(queryResult);
    replace(deps, "query", queryFake);
    const streamResult = "some-query-result";
    const streamFake = fake.returns(streamResult);
    replace(deps, "stream", streamFake);
    const schema = { a: { type: String } };
    await mongodbEventStore({
      schema,
      secretFn: secretFake,
      publishFn,
      hashFn,
      proofFn,
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
      "$type"
    );
    expect(storeFake).to.have.been.calledWith({
      name: `_${service}.${domain}`,
      schema: {
        hash: { $type: String, required: true, unique: true },
        proof: {
          id: { $type: String, required: true },
          type: { $type: String, required: true },
        },
        data: {
          saved: { $type: Date, required: true },
          id: { $type: String, required: true, unique: true },
          root: { $type: String, required: true },
          payload: formattedSchemaWithOptions,
          number: { $type: Number, required: true },
          headers: {
            topic: { $type: String, required: true },
            version: { $type: Number, required: true },
            action: { $type: String, required: true },
            domain: { $type: String, required: true },
            service: { $type: String, required: true },
            trace: { $type: String },
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
            created: { $type: Date, required: true },
            idempotency: { $type: String, required: true, unique: true },
            path: {
              $type: [
                {
                  name: { $type: String },
                  id: { $type: String },
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
              default: [],
            },
            _id: false,
          },
          _id: false,
        },
      },
      typeKey: "$type",
      indexes: [
        [{ "data.id": 1 }],
        [{ "data.root": 1 }],
        [{ "data.root": 1, "data.number": 1, _id: 1, __v: 1 }],
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
  });
});
