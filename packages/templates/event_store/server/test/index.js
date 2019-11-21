const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, stub, match, useFakeTimers } = require("sinon");

const deps = require("../deps");

let clock;

const now = new Date();

const schema = { a: 1 };
const indexes = ["some-index"];

const domain = "some-domain";
const user = "some-db-user";
const userPassword = "some-db-user-password";
const host = "some-host";
const database = "some-db";
const password = "some-password";

process.env.DOMAIN = domain;
process.env.MONGODB_USER = user;
process.env.MONGODB_USER_PASSWORD = userPassword;
process.env.MONGODB_HOST = host;
process.env.MONGODB_DATABASE = database;

describe("Event store", () => {
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
    const eventStore = require("..");
    const eStore = "some-event-store";
    const aStore = "some-aggregate-store";
    const storeFake = stub()
      .onCall(0)
      .returns(eStore)
      .onCall(1)
      .returns(aStore);
    replace(deps, "store", storeFake);
    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);
    const listenFake = fake();
    const postFake = fake.returns({
      listen: listenFake
    });
    const getFake = fake.returns({
      post: postFake
    });
    const serverFake = fake.returns({
      get: getFake
    });
    replace(deps, "server", serverFake);
    const viewStoreGetResult = "some-get-result";
    const viewStoreGetFake = fake.returns(viewStoreGetResult);
    replace(deps, "get", viewStoreGetFake);
    const viewStorePostResult = "some-post-result";
    const viewStorePostFake = fake.returns(viewStorePostResult);
    replace(deps, "post", viewStorePostFake);
    await eventStore({ schema, indexes });
    expect(storeFake).to.have.been.calledWith(
      match({
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
      })
    );
    expect(storeFake).to.have.been.calledWith({
      name: `${domain}.aggregate`,
      schema: {
        a: 1
      },
      indexes: [[{ "value.headers.root": 1 }]]
    });
    expect(secretFake).to.have.been.calledWith("mongodb");
    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledOnce;
    expect(getFake).to.have.been.calledWith(viewStoreGetResult, {
      path: "/:root"
    });
    expect(postFake).to.have.been.calledWith(viewStorePostResult);
    expect(viewStoreGetFake).to.have.been.calledWith({ store: aStore });
    expect(viewStorePostFake).to.have.been.calledWith({
      store: eStore,
      aggregateStoreName: `${domain}.aggregate`
    });
    await eventStore();
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
    replace(deps, "store", storeFake);
    const listenFake = fake();
    const postFake = fake.returns({
      listen: listenFake
    });
    const getFake = fake.returns({
      post: postFake
    });
    const serverFake = fake.returns({
      get: getFake
    });
    replace(deps, "server", serverFake);
    const viewStoreGetResult = "some-get-result";
    const viewStoreGetFake = fake.returns(viewStoreGetResult);
    replace(deps, "get", viewStoreGetFake);
    const viewStorePostResult = "some-post-result";
    const viewStorePostFake = fake.returns(viewStorePostResult);
    replace(deps, "post", viewStorePostFake);
    await eventStore({ schema, indexes });
    expect(storeFake).to.have.been.calledWith(
      match({
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
      })
    );
    expect(storeFake).to.have.been.calledWith({
      name: `${domain}.aggregate`,
      schema: {
        a: 1
      },
      indexes: [[{ "value.headers.root": 1 }]]
    });
    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledOnce;
    expect(getFake).to.have.been.calledWith(viewStoreGetResult, {
      path: "/:root"
    });
    expect(postFake).to.have.been.calledWith(viewStorePostResult);
    expect(viewStoreGetFake).to.have.been.calledWith({ store: aStore });
    expect(viewStorePostFake).to.have.been.calledWith({
      store: eStore,
      aggregateStoreName: `${domain}.aggregate`
    });
    await eventStore();
    expect(storeFake).to.have.been.calledTwice;
  });
});
