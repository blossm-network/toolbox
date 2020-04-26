const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");

const protocol = "some-db-protocol";
const domain = "some-domain";
const service = "some-service";
const name = "some-name";
const context = "some-context";
const user = "some-db-user";
const userPassword = "some-db-user-password";
const host = "some-host";
const database = "some-db";
const password = "some-password";

const writeResult = "some-write-result";

process.env.NAME = name;
process.env.CONTEXT = context;
process.env.MONGODB_PROTOCOL = protocol;
process.env.MONGODB_USER = user;
process.env.MONGODB_USER_PASSWORD = userPassword;
process.env.MONGODB_HOST = host;
process.env.MONGODB_DATABASE = database;

let mongodbEventHandler;
describe("Event handler", () => {
  beforeEach(() => {
    delete require.cache[require.resolve("..")];
    mongodbEventHandler = require("..");
    process.env.NODE_ENV = "some-env";
    delete process.env.DOMAIN;
    delete process.env.SERVICE;
  });
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);

    const number = "some-number";
    const findFake = fake.returns([{ number }]);
    const writeFake = fake.returns(writeResult);

    const db = {
      store: storeFake,
      find: findFake,
      write: writeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const eventHandlerFake = fake();
    replace(deps, "eventHandler", eventHandlerFake);

    const mainFn = "main-fn";
    const streamFn = "stream-fn";

    await mongodbEventHandler({
      mainFn,
      streamFn,
    });

    expect(storeFake).to.have.been.calledWith({
      name: `${name}.${context}.numbers`,
      schema: {
        root: { type: String, required: true },
        number: { type: Number, required: true, default: 0 },
      },
      indexes: [[{ root: 1 }], [{ number: 1 }]],
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
    expect(secretFake).to.have.been.calledWith("mongodb-event-handler");

    const root = "some-root";

    const numberFnResult = await eventHandlerFake.lastCall.lastArg.nextEventNumberFn(
      {
        root,
      }
    );

    expect(findFake).to.have.been.calledWith({
      store,
      query: { root },
      pageSize: 1,
      options: {
        lean: true,
      },
    });
    expect(numberFnResult).to.equal(number);

    const from = "some-from";
    const incrementFnResult = await eventHandlerFake.lastCall.lastArg.incrementNextEventNumberFn(
      {
        root,
        from,
      }
    );

    expect(writeFake).to.have.been.calledWith({
      store,
      query: { root, number: from },
      update: {
        $inc: { number: 1 },
      },
      options: {
        lean: true,
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    });
    expect(incrementFnResult).to.equal(writeResult);

    await mongodbEventHandler({ mainFn, streamFn });
    expect(storeFake).to.have.been.calledOnce;
  });
  it("should call with the correct params if find returns nothingj", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);

    const number = "some-number";
    const findFake = fake.returns([]);
    const writeFake = fake.returns(writeResult);

    const db = {
      store: storeFake,
      find: findFake,
      write: writeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const eventHandlerFake = fake();
    replace(deps, "eventHandler", eventHandlerFake);

    const mainFn = "main-fn";
    const streamFn = "stream-fn";

    await mongodbEventHandler({
      mainFn,
      streamFn,
    });

    expect(storeFake).to.have.been.calledWith({
      name: `${name}.${context}.numbers`,
      schema: {
        root: { type: String, required: true },
        number: { type: Number, required: true, default: 0 },
      },
      indexes: [[{ root: 1 }], [{ number: 1 }]],
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
    expect(secretFake).to.have.been.calledWith("mongodb-event-handler");

    const root = "some-root";

    const numberFnResult = await eventHandlerFake.lastCall.lastArg.nextEventNumberFn(
      {
        root,
      }
    );

    expect(findFake).to.have.been.calledWith({
      store,
      query: { root },
      pageSize: 1,
      options: {
        lean: true,
      },
    });
    expect(numberFnResult).to.equal(0);

    const from = "some-from";
    const incrementFnResult = await eventHandlerFake.lastCall.lastArg.incrementNextEventNumberFn(
      {
        root,
        from,
      }
    );

    expect(writeFake).to.have.been.calledWith({
      store,
      query: { root, number: from },
      update: {
        $inc: { number: 1 },
      },
      options: {
        lean: true,
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    });
    expect(incrementFnResult).to.equal(writeResult);

    await mongodbEventHandler({ mainFn, streamFn });
    expect(storeFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with domain and service and local env", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);

    const number = "some-number";
    const findFake = fake.returns([{ number }]);
    const writeFake = fake.returns(writeResult);

    const db = {
      store: storeFake,
      find: findFake,
      write: writeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const eventHandlerFake = fake();
    replace(deps, "eventHandler", eventHandlerFake);

    const mainFn = "main-fn";
    const streamFn = "stream-fn";

    process.env.DOMAIN = domain;
    process.env.SERVICE = service;
    process.env.NODE_ENV = "local";

    await mongodbEventHandler({
      mainFn,
      streamFn,
    });

    expect(storeFake).to.have.been.calledWith({
      name: `${name}.${domain}.${service}.${context}.numbers`,
      schema: {
        root: { type: String, required: true },
        number: { type: Number, required: true, default: 0 },
      },
      indexes: [[{ root: 1 }], [{ number: 1 }]],
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
  });
});
