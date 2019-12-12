const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, stub, match, useFakeTimers } = require("sinon");

const deps = require("../deps");

let clock;

const now = new Date();

const schema = { a: 1 };

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
const writeResult = "some-write-result";
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

    const writeFake = fake.returns(writeResult);
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
        payload: { type: Object, required: true },
        headers: {
          root: { type: String, required: true },
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
      indexes: [[{ id: 1 }]],
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
        a: 1
      },
      indexes: [[{ "value.headers.root": 1 }]]
    });
    expect(secretFake).to.have.been.calledWith("mongodb");
    expect(eventStoreFake).to.have.been.calledWith({
      findOneFn: match(async fn => {
        const result = await fn({ root });
        expect(findOneFake).to.have.been.calledWith({
          store: aStore,
          query: {
            "value.headers.root": root
          },
          options: {
            lean: true
          }
        });
        return expect(result).to.equal(found);
      }),
      writeFn: match(async fn => {
        const result = await fn({ id, data });
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
        return expect(result).to.equal(writeResult);
      }),
      mapReduceFn: match(async fn => {
        const result = await fn({ id });
        expect(mapReduceFake).to.have.been.calledWith({
          store: eStore,
          query: { id },
          map: deps.normalize,
          reduce: deps.reduce,
          out: { reduce: `${domain}.aggregate` }
        });
        return expect(result).to.equal(mapReduceResult);
      }),
      publishFn
    });
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
        payload: { type: Object, required: true },
        headers: {
          root: { type: String, required: true },
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
      indexes: [[{ id: 1 }]],
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
        a: 1
      },
      indexes: [[{ "value.headers.root": 1 }]]
    });
    await eventStore();
    expect(storeFake).to.have.been.calledTwice;
  });
});
