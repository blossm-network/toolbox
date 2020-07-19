const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const command = require("..");

const mainFn = "some-main-fn";
const aggregateFn = "some-aggregate-fn";
const commandFn = "some-command-fn";
const queryAggregatesFn = "some-query-aggregates-fn";
const readFactFn = "some-read-fact-fn";
const streamFactFn = "some-stream-fact-fn";
const addFn = "some-add-fn";
const countFn = "some-count-fn";
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
      listen: listenFake,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const commandPostResult = "some-post-result";
    const commandPostFake = fake.returns(commandPostResult);
    replace(deps, "post", commandPostFake);

    const result = await command({
      version,
      mainFn,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      addFn,
      countFn,
      validateFn,
      normalizeFn,
      fillFn,
    });

    expect(result).to.equal(returnValue);
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith();
    expect(postFake).to.have.been.calledWith(commandPostResult);
    expect(commandPostFake).to.have.been.calledWith({
      version,
      mainFn,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      validateFn,
      normalizeFn,
      addFn,
      countFn,
      fillFn,
    });
  });
  it("should call with the correct params with optionals omitted", async () => {
    const listenFake = fake();
    const postFake = fake.returns({
      listen: listenFake,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const commandPostResult = "some-post-result";
    const commandPostFake = fake.returns(commandPostResult);
    replace(deps, "post", commandPostFake);

    await command({
      version,
      mainFn,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      addFn,
      countFn,
    });

    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith();
    expect(postFake).to.have.been.calledWith(commandPostResult);
    expect(commandPostFake).to.have.been.calledWith({
      version,
      mainFn,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      addFn,
      countFn,
    });
  });
  it("should throw correctly", async () => {
    const error = new Error("some-message");
    const listenFake = fake.rejects(error);
    const postFake = fake.returns({
      listen: listenFake,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const commandPostResult = "some-post-result";
    const commandPostFake = fake.returns(commandPostResult);
    replace(deps, "post", commandPostFake);

    try {
      await command({
        version,
        mainFn,
        aggregateFn,
        commandFn,
        queryAggregatesFn,
        readFactFn,
        streamFactFn,
        addFn,
        countFn,
      });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
