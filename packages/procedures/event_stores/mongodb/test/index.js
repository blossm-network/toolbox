const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, stub, match, useFakeTimers } = require("sinon");

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

process.env.DOMAIN = domain;
process.env.MONGODB_PROTOCOL = protocol;
process.env.MONGODB_USER = user;
process.env.MONGODB_USER_PASSWORD = userPassword;
process.env.MONGODB_HOST = host;
process.env.MONGODB_DATABASE = database;

const root = "some-root";
const findResult = [
  { payload: { b: 2, c: 2 }, headers: { number: 1, root } },
  { payload: { c: 3, d: 4 }, headers: { number: 2, root } }
];
const findOneResult = {
  state: { a: 1, b: 1 },
  headers: { lastEventNumber: 0, root }
};
const createResult = { a: 1 };
const id = "some-id";
const data = "some-data";

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

    const findFake = fake.returns(findResult);
    const findOneFake = fake.returns(findOneResult);

    const createFake = fake.returns([{ ...createResult, __v: 3, _id: 4 }]);

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      find: findFake,
      findOne: findOneFake,
      create: createFake,
      store: storeFake
    };
    replace(deps, "db", db);

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
    expect(eventStoreFake).to.have.been.calledWith({
      aggregateFn: match(fn => expect(fn({ id })).to.exist),
      saveEventFn: match(fn => expect(fn({ id, data })).to.exist),
      queryFn: match(fn => expect(fn({ a: 1 })).to.exist),
      publishFn
    });

    const aggregateFnResult = await eventStoreFake.lastCall.lastArg.aggregateFn(
      root
    );

    expect(findFake).to.have.been.calledWith({
      store: eStore,
      query: {
        "headers.root": root
      },
      sort: {
        "headers.number": 1
      },
      options: {
        lean: true
      }
    });
    expect(findOneFake).to.have.been.calledWith({
      store: sStore,
      query: {
        "headers.root": root
      },
      options: {
        lean: true
      }
    });
    expect(aggregateFnResult).to.deep.equal({
      state: { a: 1, b: 2, c: 3, d: 4 },
      headers: { root, lastEventNumber: 2 }
    });

    const event = {
      id
    };
    const saveEventFnResult = await eventStoreFake.lastCall.lastArg.saveEventFn(
      event
    );
    expect(createFake).to.have.been.calledWith({
      store: eStore,
      data: event
    });
    expect(saveEventFnResult).to.deep.equal(createResult);

    await mongodbEventStore();
    expect(storeFake).to.have.been.calledTwice;
  });
  it("should call query with the correct params with snapshot and events found", async () => {
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

    const snapshotRoot = "some-snapshot-root";
    const eventRoot = "some-event-root";
    const findSnapshotResult = [{ headers: { root: snapshotRoot } }];
    const findEventResult = [
      { headers: { root: eventRoot } },
      { headers: { root: eventRoot } }
    ];
    const findFake = stub()
      .onCall(0)
      .returns(findSnapshotResult)
      .onCall(1)
      .returns(findEventResult)
      .onCall(2)
      .returns(findResult)
      .onCall(3)
      .returns(findResult);

    const bogusRoot = "some-bogus-root";
    const bogusFindOneResult = {
      state: { a: 3, b: 1 },
      headers: { lastEventNumber: 0, root: bogusRoot }
    };
    const findOneFake = stub()
      .onCall(0)
      .returns(findOneResult)
      .onCall(1)
      .returns(bogusFindOneResult);

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      find: findFake,
      findOne: findOneFake,
      store: storeFake
    };
    replace(deps, "db", db);

    await mongodbEventStore({ schema, publishFn });

    const query = { a: 1 };
    const queryFnResult = await eventStoreFake.lastCall.lastArg.queryFn(query);
    expect(findFake).to.have.callCount(4);
    expect(findOneFake).to.have.callCount(2);
    expect(findFake).to.have.been.calledWith({
      store: eStore,
      query: {
        payload: query
      },
      options: {
        lean: true
      }
    });
    expect(findFake).to.have.been.calledWith({
      store: eStore,
      query: {
        "headers.root": eventRoot
      },
      sort: {
        "headers.number": 1
      },
      options: {
        lean: true
      }
    });
    expect(findOneFake).to.have.been.calledWith({
      store: sStore,
      query: {
        "headers.root": snapshotRoot
      },
      options: {
        lean: true
      }
    });

    expect(queryFnResult).to.deep.equal([
      {
        state: { a: 1, b: 2, c: 3, d: 4 },
        headers: { root, lastEventNumber: 2 }
      }
    ]);
  });
  it("should call query with the correct params with no snapshot, but events found", async () => {
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

    const eventRoot = "some-event-root";
    const findEventResult = [
      { headers: { root: eventRoot } },
      { headers: { root: eventRoot } }
    ];
    const findFake = stub()
      .onCall(0)
      .returns([])
      .onCall(1)
      .returns(findEventResult)
      .onCall(2)
      .returns([{ payload: { a: 1, b: 2, c: 2 }, headers: { number: 1 } }])
      .onCall(3)
      .returns(findResult);

    const findOneFake = stub()
      .onCall(0)
      .returns(null)
      .onCall(1)
      .returns(null);

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      find: findFake,
      findOne: findOneFake,
      store: storeFake
    };
    replace(deps, "db", db);

    await mongodbEventStore({ schema, publishFn });

    const query = { a: 1 };
    const queryFnResult = await eventStoreFake.lastCall.lastArg.queryFn(query);
    expect(findFake).to.have.callCount(3);
    expect(findOneFake).to.have.callCount(1);

    expect(findFake).to.have.been.calledWith({
      store: eStore,
      query: {
        payload: query
      },
      options: {
        lean: true
      }
    });
    expect(findFake).to.have.been.calledWith({
      store: eStore,
      query: {
        "headers.root": eventRoot
      },
      sort: {
        "headers.number": 1
      },
      options: {
        lean: true
      }
    });
    expect(findOneFake).to.have.been.calledWith({
      store: sStore,
      query: {
        "headers.root": eventRoot
      },
      options: {
        lean: true
      }
    });

    expect(queryFnResult).to.deep.equal([
      {
        state: { a: 1, b: 2, c: 2 },
        headers: { root: eventRoot, lastEventNumber: 1 }
      }
    ]);
  });
  it("should call query with the correct params with snapshot and events found with multipart query", async () => {
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

    const snapshotRoot = "some-snapshot-root";
    const eventRoot = "some-event-root";
    const findSnapshotResult = [{ headers: { root: snapshotRoot } }];
    const findEventResult = [
      { headers: { root: eventRoot } },
      { headers: { root: eventRoot } }
    ];
    const findOneResult = {
      state: { a: { b: { c: 1 } }, d: "sure", e: true },
      headers: { lastEventNumber: 0, root }
    };
    const findFake = stub()
      .onCall(0)
      .returns(findSnapshotResult)
      .onCall(1)
      .returns(findEventResult)
      .onCall(2)
      .returns([])
      .onCall(3)
      .returns([]);

    const bogusRoot = "some-bogus-root";
    const bogusFindOneResult = {
      state: { a: 3, b: 1 },
      headers: { lastEventNumber: 0, root: bogusRoot }
    };
    const findOneFake = stub()
      .onCall(0)
      .returns(findOneResult)
      .onCall(1)
      .returns(bogusFindOneResult);

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      find: findFake,
      findOne: findOneFake,
      store: storeFake
    };
    replace(deps, "db", db);

    await mongodbEventStore({ schema, publishFn });

    const query = { "a.b.c": 1, d: "sure", e: true };
    const queryFnResult = await eventStoreFake.lastCall.lastArg.queryFn(query);
    expect(findFake).to.have.callCount(4);
    expect(findOneFake).to.have.callCount(2);
    expect(findFake).to.have.been.calledWith({
      store: eStore,
      query: {
        payload: query
      },
      options: {
        lean: true
      }
    });
    expect(findFake).to.have.been.calledWith({
      store: eStore,
      query: {
        "headers.root": eventRoot
      },
      sort: {
        "headers.number": 1
      },
      options: {
        lean: true
      }
    });
    expect(findOneFake).to.have.been.calledWith({
      store: sStore,
      query: {
        "headers.root": snapshotRoot
      },
      options: {
        lean: true
      }
    });

    expect(queryFnResult).to.deep.equal([
      {
        state: { a: { b: { c: 1 } }, d: "sure", e: true },
        headers: { root, lastEventNumber: 0 }
      }
    ]);
  });
  it("should call query with the correct params with snapshot and no events found", async () => {
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

    const snapshotRoot = "some-snapshot-root";
    const otherSnapshotRoot = "some-other-snapshot-root";
    const findSnapshotResult = [
      { headers: { root: snapshotRoot } },
      { headers: { root: otherSnapshotRoot } }
    ];
    const findFake = stub()
      .onCall(0)
      .returns([])
      .onCall(1)
      .returns(findSnapshotResult)
      .onCall(2)
      .returns(findResult)
      .onCall(3)
      .returns(findResult);

    const findOneFake = stub()
      .onCall(0)
      .returns(findOneResult)
      .onCall(1)
      .returns(findOneResult);

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      find: findFake,
      findOne: findOneFake,
      store: storeFake
    };
    replace(deps, "db", db);

    await mongodbEventStore({ schema, publishFn });

    const query = { a: 1 };
    const queryFnResult = await eventStoreFake.lastCall.lastArg.queryFn(query);
    expect(findFake).to.have.callCount(4);
    expect(findOneFake).to.have.callCount(2);

    expect(queryFnResult).to.deep.equal([
      {
        state: { a: 1, b: 2, c: 3, d: 4 },
        headers: { root, lastEventNumber: 2 }
      },
      {
        state: { a: 1, b: 2, c: 3, d: 4 },
        headers: { root, lastEventNumber: 2 }
      }
    ]);
  });
  it("should call query with the correct params with no snapshot and no events found", async () => {
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

    const findFake = stub()
      .onCall(0)
      .returns([])
      .onCall(1)
      .returns([]);

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      find: findFake,
      store: storeFake
    };
    replace(deps, "db", db);

    await mongodbEventStore({ schema, publishFn });

    const query = { a: 1 };
    const queryFnResult = await eventStoreFake.lastCall.lastArg.queryFn(query);
    expect(findFake).to.have.callCount(2);

    expect(queryFnResult).to.deep.equal([]);
  });
  it("should throw calling query with the correct params with complex query", async () => {
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

    const snapshotRoot = "some-snapshot-root";
    const eventRoot = "some-event-root";
    const findSnapshotResult = [{ headers: { root: snapshotRoot } }];
    const findEventResult = [
      { headers: { root: eventRoot } },
      { headers: { root: eventRoot } }
    ];
    const findFake = stub()
      .onCall(0)
      .returns(findSnapshotResult)
      .onCall(1)
      .returns(findEventResult)
      .onCall(2)
      .returns(findResult)
      .onCall(3)
      .returns(findResult);

    const bogusRoot = "some-bogus-root";
    const bogusFindOneResult = {
      state: { a: 3, b: 1 },
      headers: { lastEventNumber: 0, root: bogusRoot }
    };
    const findOneFake = stub()
      .onCall(0)
      .returns(findOneResult)
      .onCall(1)
      .returns(bogusFindOneResult);

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      find: findFake,
      findOne: findOneFake,
      store: storeFake
    };
    replace(deps, "db", db);

    await mongodbEventStore({ schema, publishFn });

    const query = {
      a: {
        $lt: 4
      }
    };

    try {
      await eventStoreFake.lastCall.lastArg.queryFn(query);

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(
        "Complex queries are not supported on aggregates at this time."
      );
    }
  });
  it("should throw correct error when events have a duplicate id", async () => {
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

    class DuplicateError extends Error {
      constructor() {
        super();
        this.code = "11000";
        this.keyPattern = { id: 1 };
      }
    }
    const createFake = fake.throws(new DuplicateError());

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      create: createFake,
      store: storeFake
    };
    replace(deps, "db", db);

    await mongodbEventStore({ schema, publishFn });

    const event = {
      id,
      headers: {
        number: "some-number"
      }
    };

    try {
      await eventStoreFake.lastCall.lastArg.saveEventFn(event);

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.statusCode).to.equal(412);
    }
  });
  it("should call with the correct params with no aggregate", async () => {
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

    const findFake = fake.returns(findResult);
    const findOneFake = fake();

    const createFake = fake.returns([{ ...createResult, __v: 3, _id: 4 }]);

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      find: findFake,
      findOne: findOneFake,
      create: createFake,
      store: storeFake
    };
    replace(deps, "db", db);

    await mongodbEventStore({ schema, publishFn });

    const aggregateFnResult = await eventStoreFake.lastCall.lastArg.aggregateFn(
      root
    );

    expect(findFake).to.have.been.calledWith({
      store: eStore,
      query: {
        "headers.root": root
      },
      sort: {
        "headers.number": 1
      },
      options: {
        lean: true
      }
    });
    expect(findOneFake).to.have.been.calledWith({
      store: sStore,
      query: {
        "headers.root": root
      },
      options: {
        lean: true
      }
    });
    expect(aggregateFnResult).to.deep.equal({
      state: { b: 2, c: 3, d: 4 },
      headers: { root, lastEventNumber: 2 }
    });
  });
  it("should call with the correct params with no aggregate and no events", async () => {
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

    const findFake = fake.returns([]);
    const findOneFake = fake();

    const createFake = fake.returns([{ ...createResult, __v: 3, _id: 4 }]);

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      find: findFake,
      findOne: findOneFake,
      create: createFake,
      store: storeFake
    };
    replace(deps, "db", db);

    await mongodbEventStore({ schema, publishFn });

    const aggregateFnResult = await eventStoreFake.lastCall.lastArg.aggregateFn(
      root
    );

    expect(findFake).to.have.been.calledWith({
      store: eStore,
      query: {
        "headers.root": root
      },
      sort: {
        "headers.number": 1
      },
      options: {
        lean: true
      }
    });
    expect(findOneFake).to.have.been.calledWith({
      store: sStore,
      query: {
        "headers.root": root
      },
      options: {
        lean: true
      }
    });
    expect(aggregateFnResult).to.be.null;

    await mongodbEventStore();
    expect(storeFake).to.have.been.calledTwice;
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

    const findFake = fake.returns(findResult);
    const findOneFake = fake.returns(findOneResult);

    const createFake = fake.returns([{ ...createResult, __v: 3, _id: 4 }]);

    const eventStoreSchema = { a: String };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      find: findFake,
      findOne: findOneFake,
      create: createFake,
      store: storeFake
    };
    replace(deps, "db", db);

    process.env.NODE_ENV = "local";

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

    const findFake = fake.returns(findResult);
    const findOneFake = fake.returns(findOneResult);

    const createFake = fake.returns([{ ...createResult, __v: 3, _id: 4 }]);

    const eventStoreSchema = { a: { type: String } };
    const snapshotStoreSchema = "some-snapshot-schema";
    const removeIdsFake = stub()
      .onCall(0)
      .returns(eventStoreSchema)
      .onCall(1)
      .returns(snapshotStoreSchema);

    replace(deps, "removeIds", removeIdsFake);

    const db = {
      find: findFake,
      findOne: findOneFake,
      create: createFake,
      store: storeFake
    };
    replace(deps, "db", db);

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
