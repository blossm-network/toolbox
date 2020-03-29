const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, stub, useFakeTimers } = require("sinon");

const deps = require("../deps");

let clock;

const now = new Date();

const schema = "some-schema";

const domain = "some-domain";
const user = "some-db-user";
const protocol = "some-db-protocol";
const userPassword = "some-db-user-password";
const host = "some-host";
const database = "some-db";
const password = "some-password";
const handlers = "some-handlers";

process.env.DOMAIN = domain;
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
    const storeFake = stub()
      .onCall(0)
      .returns(eStore)
      .onCall(1)
      .returns(sStore)
      .onCall(2)
      .returns(cStore);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const eventStoreFake = fake();
    replace(deps, "eventStore", eventStoreFake);

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      store: storeFake
    };
    replace(deps, "db", db);

    const saveEventsResult = "some-save-events-result";
    const saveEventsFake = fake.returns(saveEventsResult);
    replace(deps, "saveEvents", saveEventsFake);
    const reserveRootCountsResult = "some-reserve-root-count-result";
    const reserveRootCountsFake = fake.returns(reserveRootCountsResult);
    replace(deps, "reserveRootCounts", reserveRootCountsFake);
    const aggregateResult = "some-aggregate-result";
    const aggregateFake = fake.returns(aggregateResult);
    replace(deps, "aggregate", aggregateFake);
    const queryResult = "some-query-result";
    const queryFake = fake.returns(queryResult);
    replace(deps, "query", queryFake);

    await mongodbEventStore({ schema, handlers, publishFn });

    expect(removeIdsFake).to.have.been.calledWith({
      schema
    });
    expect(removeIdsFake).to.have.been.calledTwice;
    expect(storeFake).to.have.been.calledWith({
      name: domain,
      schema: {
        id: { type: String, required: true, unique: true },
        saved: { type: Date, required: true },
        payload: {
          a: {
            type: String,
            required: false,
            unique: false,
            default: undefined
          }
        },
        headers: {
          root: { type: String, required: true },
          number: { type: Number, required: true },
          topic: { type: String, required: true },
          version: { type: Number, required: true },
          action: { type: String, required: true },
          domain: { type: String, required: true },
          service: { type: String, required: true },
          trace: { type: String },
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
        [{ "headers.root": 1, "headers.number": 1, _id: 1, __v: 1 }]
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
          w: "majority"
        },
        autoIndex: true
      }
    });
    expect(storeFake).to.have.been.calledWith({
      name: `${domain}.snapshots`,
      schema: {
        created: { type: Date, required: true },
        headers: {
          root: { type: String, required: true, unique: true },
          lastEventNumber: { type: Number, required: true }
        },
        state: snapshotStoreSchema
      },
      indexes: [[{ "headers.root": 1 }]]
    });
    expect(secretFake).to.have.been.calledWith("mongodb-event-store");

    expect(saveEventsFake).to.have.been.calledWith({
      eventStore: eStore,
      handlers
    });
    expect(reserveRootCountsFake).to.have.been.calledWith({
      countsStore: cStore
    });
    expect(aggregateFake).to.have.been.calledWith({
      eventStore: eStore,
      snapshotStore: sStore,
      handlers
    });
    expect(queryFake).to.have.been.calledWith({
      eventStore: eStore,
      snapshotStore: sStore,
      handlers
    });
    expect(eventStoreFake).to.have.been.calledWith({
      aggregateFn: aggregateResult,
      saveEventsFn: saveEventsResult,
      queryFn: queryResult,
      reserveRootCountsFn: reserveRootCountsResult,
      publishFn
    });

    await mongodbEventStore();
    expect(storeFake).to.have.been.calledThrice;
  });
  it("should call with the correct params with indexes", async () => {
    const mongodbEventStore = require("..");
    const eStore = "some-event-store";
    const sStore = "some-snapshot-store";
    const storeFake = stub()
      .onCall(0)
      .returns(eStore)
      .onCall(1)
      .returns(sStore);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const eventStoreFake = fake();
    replace(deps, "eventStore", eventStoreFake);

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      store: storeFake
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

    await mongodbEventStore({ schema, indexes: [index], publishFn });

    expect(storeFake).to.have.been.calledWith({
      name: domain,
      schema: {
        id: { type: String, required: true, unique: true },
        saved: { type: Date, required: true },
        payload: {
          a: {
            type: String,
            required: false,
            unique: false,
            default: undefined
          }
        },
        headers: {
          root: { type: String, required: true },
          number: { type: Number, required: true },
          topic: { type: String, required: true },
          version: { type: Number, required: true },
          action: { type: String, required: true },
          domain: { type: String, required: true },
          service: { type: String, required: true },
          trace: { type: String },
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
        [{ [index]: 1 }]
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
          w: "majority"
        },
        autoIndex: true
      }
    });
    expect(storeFake).to.have.been.calledWith({
      name: `${domain}.snapshots`,
      schema: {
        created: { type: Date, required: true },
        headers: {
          root: { type: String, required: true, unique: true },
          lastEventNumber: { type: Number, required: true }
        },
        state: snapshotStoreSchema
      },
      indexes: [[{ "headers.root": 1 }], [{ [index]: 1 }]]
    });
    expect(storeFake).to.have.been.calledWith({
      name: `${domain}.counts`,
      schema: {
        root: { type: String, required: true },
        value: { type: Number, required: true, default: 0 }
      },
      indexes: [[{ root: 1 }]]
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
    replace(deps, "secret", secretFake);

    const eventStoreFake = fake();
    replace(deps, "eventStore", eventStoreFake);

    const eventStoreSchema = { a: { type: String } };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      store: storeFake
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
    await mongodbEventStore({ schema, publishFn });

    expect(removeIdsFake).to.have.been.calledWith({
      schema
    });
    expect(removeIdsFake).to.have.been.calledTwice;
    expect(storeFake).to.have.been.calledWith({
      name: domain,
      schema: {
        id: { type: String, required: true, unique: true },
        saved: { type: Date, required: true },
        payload: {
          a: {
            type: String,
            required: false,
            unique: false,
            default: undefined
          }
        },
        headers: {
          root: { type: String, required: true },
          number: { type: Number, required: true },
          topic: { type: String, required: true },
          version: { type: Number, required: true },
          action: { type: String, required: true },
          domain: { type: String, required: true },
          service: { type: String, required: true },
          trace: { type: String },
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
        [{ "headers.root": 1, "headers.number": 1, _id: 1, __v: 1 }]
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
          w: "majority"
        },
        autoIndex: true
      }
    });
  });
});
