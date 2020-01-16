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

    const saveEventResult = "some-save-event-result";
    const saveEventFake = fake.returns(saveEventResult);
    replace(deps, "saveEvent", saveEventFake);
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
        saved: { type: String, required: true },
        payload: { a: { type: String, required: false } },
        headers: {
          root: { type: String, required: true },
          number: { type: Number, required: true },
          topic: { type: String, required: true },
          version: { type: Number, required: true },
          trace: { type: String },
          context: { type: Object },
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
        [{ "headers.root": 1, "headers.number": 1 }]
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
        created: { type: Number, required: true },
        headers: {
          root: { type: String, required: true, unique: true },
          lastEventNumber: { type: Number, required: true }
        },
        state: snapshotStoreSchema
      },
      indexes: [[{ "headers.root": 1 }]]
    });
    expect(secretFake).to.have.been.calledWith("mongodb");

    expect(saveEventFake).to.have.been.calledWith({ eventStore: eStore });
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
      saveEventFn: saveEventResult,
      queryFn: queryResult,
      publishFn
    });

    await mongodbEventStore();
    expect(storeFake).to.have.been.calledTwice;
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
    const saveEventResult = "some-save-event-result";
    const saveEventFake = fake.returns(saveEventResult);
    replace(deps, "saveEvent", saveEventFake);
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
        saved: { type: String, required: true },
        payload: { a: { type: String, required: false } },
        headers: {
          root: { type: String, required: true },
          number: { type: Number, required: true },
          topic: { type: String, required: true },
          version: { type: Number, required: true },
          trace: { type: String },
          context: { type: Object },
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
        created: { type: Number, required: true },
        headers: {
          root: { type: String, required: true, unique: true },
          lastEventNumber: { type: Number, required: true }
        },
        state: snapshotStoreSchema
      },
      indexes: [[{ "headers.root": 1 }], [{ [index]: 1 }]]
    });
  });
  it("should call with the correct params in local env", async () => {
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

    process.env.NODE_ENV = "local";

    const saveEventResult = "some-save-event-result";
    const saveEventFake = fake.returns(saveEventResult);
    replace(deps, "saveEvent", saveEventFake);
    const aggregateResult = "some-aggregate-result";
    const aggregateFake = fake.returns(aggregateResult);
    replace(deps, "aggregate", aggregateFake);
    const queryResult = "some-query-result";
    const queryFake = fake.returns(queryResult);
    replace(deps, "query", queryFake);

    await mongodbEventStore({ schema, publishFn });

    expect(storeFake).to.have.been.calledWith({
      name: domain,
      schema: {
        id: { type: String, required: true, unique: true },
        saved: { type: String, required: true },
        payload: { a: { type: String, required: false } },
        headers: {
          root: { type: String, required: true },
          number: { type: Number, required: true },
          topic: { type: String, required: true },
          version: { type: Number, required: true },
          trace: { type: String },
          context: { type: Object },
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
        [{ "headers.root": 1, "headers.number": 1 }]
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
          w: "majority"
        },
        autoIndex: true
      }
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

    const saveEventResult = "some-save-event-result";
    const saveEventFake = fake.returns(saveEventResult);
    replace(deps, "saveEvent", saveEventFake);
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
        saved: { type: String, required: true },
        payload: { a: { type: String, required: false } },
        headers: {
          root: { type: String, required: true },
          number: { type: Number, required: true },
          topic: { type: String, required: true },
          version: { type: Number, required: true },
          trace: { type: String },
          context: { type: Object },
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
        [{ "headers.root": 1, "headers.number": 1 }]
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
