const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");

const aggregateFn = "some-aggregate-fn";
const queryFn = "some-query-fn";
const saveEventFn = "some-save-event-fn";
const publishFn = "some-publish-fn";

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
    await eventStore({ aggregateFn, saveEventFn, queryFn, publishFn });
    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledOnce;
    expect(getFake).to.have.been.calledWith(eventStoreGetResult, {
      path: "/:root?"
    });
    expect(postFake).to.have.been.calledWith(eventStorePostResult);
    expect(eventStoreGetFake).to.have.been.calledWith({ aggregateFn, queryFn });
    expect(eventStorePostFake).to.have.been.calledWith({
      saveEventFn,
      aggregateFn,
      publishFn
    });
  });
});
