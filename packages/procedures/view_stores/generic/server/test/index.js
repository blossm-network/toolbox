const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match } = require("sinon");

const deps = require("../deps");

describe("View store", () => {
  beforeEach(() => {
    delete require.cache[require.resolve("..")];
    process.env.NODE_ENV = "some-env";
  });
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const viewStore = require("..");

    const listenFake = fake();
    const deleteFake = fake.returns({
      listen: listenFake,
    });
    const postFake = fake.returns({
      delete: deleteFake,
    });
    const getFake = fake.returns({
      post: postFake,
    });
    const serverFake = fake.returns({
      get: getFake,
    });
    replace(deps, "server", serverFake);

    const viewStoreGetResult = "some-get-result";
    const viewStoreGetFake = fake.returns(viewStoreGetResult);
    replace(deps, "get", viewStoreGetFake);

    // const viewStoreStreamResult = "some-stream-result";
    // const viewStoreStreamFake = fake.returns(viewStoreStreamResult);
    // replace(deps, "stream", viewStoreStreamFake);

    const viewStorePostResult = "some-post-result";
    const viewStorePostFake = fake.returns(viewStorePostResult);
    replace(deps, "post", viewStorePostFake);

    const viewStoreDeleteResult = "some-delete-result";
    const viewStoreDeleteFake = fake.returns(viewStoreDeleteResult);
    replace(deps, "delete", viewStoreDeleteFake);

    // const streamFn = "some-stream-fn";
    const findFn = "some-find-fn";
    const countFn = "some-count-fn";
    const writeFn = "some-write-fn";
    const removeFn = "some-remove-fn";
    const queryFn = "some-query-fn";
    const updateFn = "some-update-fn";
    const formatFn = "some-format-fn";
    const one = "some-one";

    await viewStore({
      // streamFn,
      findFn,
      countFn,
      writeFn,
      removeFn,
      queryFn,
      updateFn,
      formatFn,
      one,
    });

    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledOnce;
    // expect(firstGetFake).to.have.been.calledWith(viewStoreStreamResult, {
    //   path:
    //     "/stream/:sourceNetwork?/:sourceService?/:sourceDomain?/:sourceRoot?",
    // });
    expect(getFake).to.have.been.calledWith(viewStoreGetResult, {
      path: "/:sourceNetwork?/:sourceService?/:sourceDomain?/:sourceRoot?",
    });
    expect(postFake).to.have.been.calledWith(viewStorePostResult);
    expect(deleteFake).to.have.been.calledWith(viewStoreDeleteResult);
    // expect(viewStoreStreamFake).to.have.been.calledWith({
    //   streamFn,
    //   queryFn,
    // });
    expect(viewStoreGetFake).to.have.been.calledWith({
      findFn,
      countFn,
      queryFn,
      formatFn,
      one,
    });
    expect(viewStorePostFake).to.have.been.calledWith({
      writeFn,
      updateFn,
      formatFn,
    });
    expect(viewStoreDeleteFake).to.have.been.calledWith({ removeFn });
  });
  it("should call with the correct params with optionals missing", async () => {
    const viewStore = require("..");

    const listenFake = fake();
    const deleteFake = fake.returns({
      listen: listenFake,
    });
    const postFake = fake.returns({
      delete: deleteFake,
    });
    const getFake = fake.returns({
      post: postFake,
    });
    const serverFake = fake.returns({
      get: getFake,
    });
    replace(deps, "server", serverFake);

    const viewStoreGetResult = "some-get-result";
    const viewStoreGetFake = fake.returns(viewStoreGetResult);
    replace(deps, "get", viewStoreGetFake);

    // const viewStoreStreamResult = "some-stream-result";
    // const viewStoreStreamFake = fake.returns(viewStoreStreamResult);
    // replace(deps, "stream", viewStoreStreamFake);

    const viewStorePostResult = "some-post-result";
    const viewStorePostFake = fake.returns(viewStorePostResult);
    replace(deps, "post", viewStorePostFake);

    const viewStoreDeleteResult = "some-delete-result";
    const viewStoreDeleteFake = fake.returns(viewStoreDeleteResult);
    replace(deps, "delete", viewStoreDeleteFake);

    // const streamFn = "some-stream-fn";
    const findFn = "some-find-fn";
    const countFn = "some-count-fn";
    const writeFn = "some-write-fn";
    const removeFn = "some-remove-fn";

    await viewStore({
      // streamFn,
      findFn,
      countFn,
      writeFn,
      removeFn,
    });

    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledOnce;
    expect(getFake).to.have.been.calledWith(viewStoreGetResult);
    // expect(firstGetFake).to.have.been.calledWith(viewStoreStreamResult, {
    //   path:
    //     "/stream/:sourceNetwork?/:sourceService?/:sourceDomain?/:sourceRoot?",
    // });
    expect(postFake).to.have.been.calledWith(viewStorePostResult);
    expect(deleteFake).to.have.been.calledWith(viewStoreDeleteResult);
    // expect(viewStoreStreamFake).to.have.been.calledWith({ streamFn });
    expect(viewStoreGetFake).to.have.been.calledWith({
      findFn,
      countFn,
      formatFn: match((fn) => {
        const input = "some-input";
        const output = fn(input);
        return input == output;
      }),
    });
    expect(viewStorePostFake).to.have.been.calledWith({
      writeFn,
      formatFn: match((fn) => {
        const input = "some-input";
        const output = fn(input);
        return input == output;
      }),
    });
    expect(viewStoreDeleteFake).to.have.been.calledWith({ removeFn });
  });
});
