const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");

const findOneFn = "some-find-on-fn";
const writeFn = "some-write-fn";
const mapReduceFn = "some-map-reduce-fn";

describe("Event store", () => {
  beforeEach(() => {
    delete require.cache[require.resolve("..")];
  });
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const eventStore = require("..");
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
    const eventStoreGetResult = "some-get-result";
    const eventStoreGetFake = fake.returns(eventStoreGetResult);
    replace(deps, "get", eventStoreGetFake);
    const eventStorePostResult = "some-post-result";
    const eventStorePostFake = fake.returns(eventStorePostResult);
    replace(deps, "post", eventStorePostFake);
    await eventStore({ findOneFn, writeFn, mapReduceFn });
    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledOnce;
    expect(getFake).to.have.been.calledWith(eventStoreGetResult, {
      path: "/:root"
    });
    expect(postFake).to.have.been.calledWith(eventStorePostResult);
    expect(eventStoreGetFake).to.have.been.calledWith({ findOneFn });
    expect(eventStorePostFake).to.have.been.calledWith({
      writeFn,
      mapReduceFn
    });
  });
});
