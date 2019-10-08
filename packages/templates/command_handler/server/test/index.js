const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const commandHandler = require("..");

const mainFn = "some-main-fn";
const validateFn = "some-validate-fn";
const normalizeFn = "some-normalize-fn";
const version = "some-version";

describe("Command handler", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
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

    await commandHandler({ version, mainFn, validateFn, normalizeFn });

    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledOnce;
    expect(postFake).to.have.been.calledWith(commandHandlerPostResult);
    expect(commandHandlerPostFake).to.have.been.calledWith({
      version,
      mainFn,
      validateFn,
      normalizeFn
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

    await commandHandler({ version, mainFn });

    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledOnce;
    expect(postFake).to.have.been.calledWith(commandHandlerPostResult);
    expect(commandHandlerPostFake).to.have.been.calledWith({
      version,
      mainFn
    });
  });
  it("should throw correctly", async () => {
    const postFake = fake.rejects(new Error());
    const serverFake = fake.returns({
      post: postFake
    });
    replace(deps, "server", serverFake);

    const commandHandlerPostResult = "some-post-result";
    const commandHandlerPostFake = fake.returns(commandHandlerPostResult);
    replace(deps, "post", commandHandlerPostFake);

    expect(async () => await commandHandler({ version, mainFn })).to.throw;
  });
});
