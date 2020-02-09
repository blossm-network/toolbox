const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const commandHandler = require("..");

const mainFn = "some-main-fn";
const aggregateFn = "some-aggregate-fn";
const validateFn = "some-validate-fn";
const normalizeFn = "some-normalize-fn";
const fillFn = "some-fill-fn";
const version = "some-version";

describe("Command handler", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const returnValue = "some-return-value";
    const listenFake = fake.returns(returnValue);
    const postFake = fake.returns({
      listen: listenFake
    });
    const serverFake = fake.returns({
      post: postFake
    });
    replace(deps, "server", serverFake);

    const commandHandlerPostResult = "some-post-result";
    const commandHandlerPostFake = fake.returns(commandHandlerPostResult);
    replace(deps, "post", commandHandlerPostFake);

    const result = await commandHandler({
      version,
      mainFn,
      aggregateFn,
      validateFn,
      normalizeFn,
      fillFn
    });

    expect(result).to.equal(returnValue);
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith();
    expect(postFake).to.have.been.calledWith(commandHandlerPostResult);
    expect(commandHandlerPostFake).to.have.been.calledWith({
      version,
      mainFn,
      aggregateFn,
      validateFn,
      normalizeFn,
      fillFn
    });
  });
  it("should call with the correct params with optionals omitted", async () => {
    const listenFake = fake();
    const postFake = fake.returns({
      listen: listenFake
    });
    const serverFake = fake.returns({
      post: postFake
    });
    replace(deps, "server", serverFake);

    const commandHandlerPostResult = "some-post-result";
    const commandHandlerPostFake = fake.returns(commandHandlerPostResult);
    replace(deps, "post", commandHandlerPostFake);

    await commandHandler({ version, mainFn, aggregateFn });

    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith();
    expect(postFake).to.have.been.calledWith(commandHandlerPostResult);
    expect(commandHandlerPostFake).to.have.been.calledWith({
      version,
      mainFn,
      aggregateFn
    });
  });
  it("should throw correctly", async () => {
    const error = new Error("some-message");
    const listenFake = fake.rejects(error);
    const postFake = fake.returns({
      listen: listenFake
    });
    const serverFake = fake.returns({
      post: postFake
    });
    replace(deps, "server", serverFake);

    const commandHandlerPostResult = "some-post-result";
    const commandHandlerPostFake = fake.returns(commandHandlerPostResult);
    replace(deps, "post", commandHandlerPostFake);

    try {
      await commandHandler({ version, mainFn, aggregateFn });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
