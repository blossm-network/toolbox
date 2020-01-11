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

const findResult = [
  { payload: { b: 2, c: 2 }, headers: { number: 1 } },
  { payload: { c: 3, d: 4 }, headers: { number: 2 } }
];
const root = "some-root";
const findOneResult = {
  state: { a: 1, b: 1 },
  headers: { lastEventNumber: 0, root }
};
const writeResult = { a: 1 };
const id = "some-id";
const data = "some-data";
const mapReduceResult = "some-result";

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

    const writeFake = fake.returns({ ...writeResult, __v: 3, _id: 4 });
    const mapReduceFake = fake.returns(mapReduceResult);

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
      write: writeFake,
      store: storeFake,
      mapReduce: mapReduceFake
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
          command: {
            id: { type: String, required: true },
            action: { type: String, required: true },
            domain: { type: String, required: true },
            service: { type: String, required: true },
            network: { type: String, required: true },
            issued: { type: String, required: true }
          }
        }
      },
      indexes: [
        [{ id: 1 }],
        [{ "headers.root": 1 }],
        [{ "headers.root": 1, "headers.number": -1 }]
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

      const writeFake = fake.returns({ ...writeResult, __v: 3, _id: 4 });
      const mapReduceFake = fake.returns(mapReduceResult);

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
        write: writeFake,
        store: storeFake,
        mapReduce: mapReduceFake
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
          "headers.number": -1
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
        headers: { root }
      });

      const event = {
        id
      };
      const saveEventFnResult = await eventStoreFake.lastCall.lastArg.saveEventFn(
        event
      );
      expect(writeFake).to.have.been.calledWith({
        store: eStore,
        query: {
          id
        },
        update: {
          $set: event
        },
        options: {
          lean: true,
          omitUndefined: true,
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      });
      expect(saveEventFnResult).to.deep.equal(writeResult);

      await mongodbEventStore();
      expect(storeFake).to.have.been.calledTwice;
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
        "headers.number": -1
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
    expect(writeFake).to.have.been.calledWith({
      store: eStore,
      query: {
        id
      },
      update: {
        $set: event
      },
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    });
    expect(saveEventFnResult).to.deep.equal(writeResult);

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

    const writeFake = fake.returns({ ...writeResult, __v: 3, _id: 4 });
    const mapReduceFake = fake.returns(mapReduceResult);

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
      write: writeFake,
      store: storeFake,
      mapReduce: mapReduceFake
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
          command: {
            id: { type: String, required: true },
            action: { type: String, required: true },
            domain: { type: String, required: true },
            service: { type: String, required: true },
            network: { type: String, required: true },
            issued: { type: String, required: true }
          }
        }
      },
      indexes: [
        [{ id: 1 }],
        [{ "headers.root": 1 }],
        [{ "headers.root": 1, "headers.number": -1 }]
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

    const writeFake = fake.returns({ ...writeResult, __v: 3, _id: 4 });
    const mapReduceFake = fake.returns(mapReduceResult);

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
      write: writeFake,
      store: storeFake,
      mapReduce: mapReduceFake
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
          command: {
            id: { type: String, required: true },
            action: { type: String, required: true },
            domain: { type: String, required: true },
            service: { type: String, required: true },
            network: { type: String, required: true },
            issued: { type: String, required: true }
          }
        }
      },
      indexes: [
        [{ id: 1 }],
        [{ "headers.root": 1 }],
        [{ "headers.root": 1, "headers.number": -1 }]
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
