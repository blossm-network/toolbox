const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, match, useFakeTimers } = require("sinon");

const deps = require("../deps");
const viewStore = require("..");

let clock;

const now = new Date();

const schema = { a: 1 };
const indexes = ["some-index"];

const domain = "some-domain";
const id = "some-id";
const user = "some-db-user";
const host = "some-host";
const database = "some-db";
const password = "some-password";

process.env.DOMAIN = domain;
process.env.ID = id;
process.env.MONGODB_USER = user;
process.env.MONGODB_HOST = host;
process.env.MONGODB_DATABASE = database;

describe("View store", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);
    replace(deps, "store", storeFake);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const listenFake = fake();
    const deleteFake = fake.returns({
      listen: listenFake
    });
    const putFake = fake.returns({
      delete: deleteFake
    });
    const postFake = fake.returns({
      put: putFake
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

    const viewStorePutResult = "some-put-result";
    const viewStorePutFake = fake.returns(viewStorePutResult);
    replace(deps, "put", viewStorePutFake);

    const viewStoreDeleteResult = "some-delete-result";
    const viewStoreDeleteFake = fake.returns(viewStoreDeleteResult);
    replace(deps, "delete", viewStoreDeleteFake);

    await viewStore({ schema, indexes });

    expect(storeFake).to.have.been.calledWith(
      match({
        name: `${domain}.${id}`,
        schema: {
          a: 1,
          uuid: { type: String, required: true },
          created: { type: Number, required: true },
          modified: { type: Number, required: true }
        },
        indexes: [
          "some-index",
          [{ uuid: 1 }],
          [{ created: 1 }],
          [{ modified: 1 }]
        ],
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
    expect(secretFake).to.have.been.calledWith("mongodb");
    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledOnce;
    expect(getFake).to.have.been.calledWith(viewStoreGetResult);
    expect(postFake).to.have.been.calledWith(viewStorePostResult);
    expect(putFake).to.have.been.calledWith(viewStorePutResult);
    expect(deleteFake).to.have.been.calledWith(viewStoreDeleteResult);
    expect(viewStoreGetFake).to.have.been.calledWith({ store });
    expect(viewStorePostFake).to.have.been.calledWith({ store });
    expect(viewStorePutFake).to.have.been.calledWith({ store });
    expect(viewStoreDeleteFake).to.have.been.calledWith({ store });

    await viewStore();
    expect(storeFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with passed in fns", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);
    replace(deps, "store", storeFake);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const listenFake = fake();
    const deleteFake = fake.returns({
      listen: listenFake
    });
    const putFake = fake.returns({
      delete: deleteFake
    });
    const postFake = fake.returns({
      put: putFake
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

    const viewStorePutResult = "some-put-result";
    const viewStorePutFake = fake.returns(viewStorePutResult);
    replace(deps, "put", viewStorePutFake);

    const viewStoreDeleteResult = "some-delete-result";
    const viewStoreDeleteFake = fake.returns(viewStoreDeleteResult);
    replace(deps, "delete", viewStoreDeleteFake);

    const getFn = "some-get-fn";
    const postFn = "some-post-fn";
    const putFn = "some-put-fn";

    await viewStore({ schema, indexes }, { getFn, postFn, putFn });

    expect(getFake).to.have.been.calledWith(viewStoreGetResult);
    expect(postFake).to.have.been.calledWith(viewStorePostResult);
    expect(putFake).to.have.been.calledWith(viewStorePutResult);
    expect(deleteFake).to.have.been.calledWith(viewStoreDeleteResult);
    expect(viewStoreGetFake).to.have.been.calledWith({ store, fn: getFn });
    expect(viewStorePostFake).to.have.been.calledWith({ store, fn: postFn });
    expect(viewStorePutFake).to.have.been.calledWith({ store, fn: putFn });
    expect(viewStoreDeleteFake).to.have.been.calledWith({ store });
  });
});
