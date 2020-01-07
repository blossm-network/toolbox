const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, stub, match, useFakeTimers } = require("sinon");

const deps = require("../deps");

let clock;

const now = new Date();

const schema = { a: String };

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

const obj = "some-objs";
const found = { value: obj };
const root = "some-root";
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
    const aStore = "some-aggregate-store";
    const storeFake = stub()
      .onCall(0)
      .returns(eStore)
      .onCall(1)
      .returns(aStore);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const eventStoreFake = fake();
    replace(deps, "eventStore", eventStoreFake);

    const findOneFake = fake.returns(found);

    const writeFake = fake.returns({ ...writeResult, __v: 3, _id: 4 });
    const mapReduceFake = fake.returns(mapReduceResult);

    const db = {
      findOne: findOneFake,
      write: writeFake,
      store: storeFake,
      mapReduce: mapReduceFake
    };
    replace(deps, "db", db);

    await mongodbEventStore({ schema, publishFn });

    expect(storeFake).to.have.been.calledWith({
      name: domain,
      schema: {
        id: { type: String, required: true, unique: true },
        created: { type: String, required: true },
        payload: { a: { type: String, required: false } },
        headers: {
          root: { type: String, required: true },
          number: { type: Number, required: true },
          numberRoot: { type: Number, required: true, unique: true },
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
      indexes: [[{ id: 1 }], [{ "headers.root": 1, "headers.number": -1 }]],
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
      name: `${domain}.aggregate`,
      schema: {
        value: {
          headers: {
            root: { type: String, required: true, unique: true },
            modified: { type: Number, required: true },
            events: { type: Number, required: true }
          },
          state: schema
        }
      },
      indexes: [[{ "value.headers.root": 1 }]]
    });
    expect(secretFake).to.have.been.calledWith("mongodb");
    expect(eventStoreFake).to.have.been.calledWith({
      findOneFn: match(fn => expect(fn({ id })).to.exist),
      writeFn: match(fn => expect(fn({ id, data })).to.exist),
      mapReduceFn: match(fn => expect(fn({ id })).to.exist),
      publishFn
    });

    const findOneFnResult = await eventStoreFake.lastCall.lastArg.findOneFn({
      root
    });

    expect(findOneFake).to.have.been.calledWith({
      store: aStore,
      query: {
        "value.headers.root": root
      },
      options: {
        lean: true
      }
    });
    expect(findOneFnResult).to.equal(obj);

    const writeFnResult = await eventStoreFake.lastCall.lastArg.writeFn({
      id,
      data
    });
    expect(writeFake).to.have.been.calledWith({
      store: eStore,
      query: {
        id
      },
      update: {
        $set: data
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
    expect(writeFnResult).to.deep.equal(writeResult);

    const mapReduceFnResult = await eventStoreFake.lastCall.lastArg.mapReduceFn(
      { id }
    );
    expect(mapReduceFake).to.have.been.calledWith({
      store: eStore,
      query: { id },
      map: deps.normalize,
      reduce: deps.reduce,
      out: { reduce: `${domain}.aggregate` }
    });
    expect(mapReduceFnResult).to.equal(mapReduceResult);

    await mongodbEventStore();
    expect(storeFake).to.have.been.calledTwice;
  });
  it("should call with the correct params in local environment", async () => {
    const eventStore = require("..");
    const eStore = "some-event-store";
    const aStore = "some-aggregate-store";

    process.env.NODE_ENV = "local";

    const storeFake = stub()
      .onCall(0)
      .returns(eStore)
      .onCall(1)
      .returns(aStore);
    replace(deps.db, "store", storeFake);

    const eventStoreFake = fake();
    replace(deps, "eventStore", eventStoreFake);

    await eventStore({ schema, publishFn });
    expect(storeFake).to.have.been.calledWith({
      name: domain,
      schema: {
        id: { type: String, required: true, unique: true },
        created: { type: String, required: true },
        payload: { a: { type: String, required: false } },
        headers: {
          root: { type: String, required: true },
          number: { type: Number, required: true },
          numberRoot: { type: Number, required: true, unique: true },
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
      indexes: [[{ id: 1 }], [{ "headers.root": 1, "headers.number": -1 }]],
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
    expect(storeFake).to.have.been.calledWith({
      name: `${domain}.aggregate`,
      schema: {
        value: {
          headers: {
            root: { type: String, required: true, unique: true },
            modified: { type: Number, required: true },
            events: { type: Number, required: true }
          },
          state: schema
        }
      },
      indexes: [[{ "value.headers.root": 1 }]]
    });
    await eventStore();
    expect(storeFake).to.have.been.calledTwice;
  });
  it("should call with the correct params with schema formatted with object property", async () => {
    const mongodbEventStore = require("..");
    const eStore = "some-event-store";
    const aStore = "some-aggregate-store";
    const storeFake = stub()
      .onCall(0)
      .returns(eStore)
      .onCall(1)
      .returns(aStore);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const eventStoreFake = fake();
    replace(deps, "eventStore", eventStoreFake);

    const findOneFake = fake.returns(found);

    const writeFake = fake.returns({ ...writeResult, __v: 3, _id: 4 });
    const mapReduceFake = fake.returns(mapReduceResult);

    const db = {
      findOne: findOneFake,
      write: writeFake,
      store: storeFake,
      mapReduce: mapReduceFake
    };
    replace(deps, "db", db);

    const schema = { a: { type: String } };
    await mongodbEventStore({ schema, publishFn });

    expect(storeFake).to.have.been.calledWith({
      name: domain,
      schema: {
        id: { type: String, required: true, unique: true },
        created: { type: String, required: true },
        payload: { a: { type: String, required: false } },
        headers: {
          root: { type: String, required: true },
          number: { type: Number, required: true },
          numberRoot: { type: Number, required: true, unique: true },
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
      indexes: [[{ id: 1 }], [{ "headers.root": 1, "headers.number": -1 }]],
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
      name: `${domain}.aggregate`,
      schema: {
        value: {
          headers: {
            root: { type: String, required: true, unique: true },
            modified: { type: Number, required: true },
            events: { type: Number, required: true }
          },
          state: schema
        }
      },
      indexes: [[{ "value.headers.root": 1 }]]
    });
  });
});
