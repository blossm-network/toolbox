const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const fact = require("..");

const mainFn = "some-main-fn";
const queryAggregatesFn = "some-query-aggregates-fn";
const aggregateFn = "some-aggregate-fn";

describe("Fact", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const returnValue = "some-return-value";
    const listenFake = fake.returns(returnValue);
    const getFake = fake.returns({
      listen: listenFake,
    });
    const streamFake = fake.returns({
      get: getFake,
    });
    const serverFake = fake.returns({
      get: streamFake,
    });
    replace(deps, "server", serverFake);

    const factGetResult = "some-get-result";
    const factGetFake = fake.returns(factGetResult);
    replace(deps, "get", factGetFake);

    const factStreamResult = "some-stream-result";
    const factStreamFake = fake.returns(factStreamResult);
    replace(deps, "stream", factStreamFake);

    const result = await fact({
      mainFn,
      queryAggregatesFn,
      aggregateFn,
    });

    expect(result).to.equal(returnValue);
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith();
    expect(getFake).to.have.been.calledWith(factGetResult, { path: "/:root?" });
    expect(streamFake).to.have.been.calledWith(factStreamResult, {
      path: "/stream/:root?",
    });
    expect(factGetFake).to.have.been.calledWith({ mainFn, queryAggregatesFn });
    expect(factStreamFake).to.have.been.calledWith({
      mainFn,
      queryAggregatesFn,
      aggregateFn,
    });
  });
  it("should throw correctly", async () => {
    const error = new Error("some-message");
    const listenFake = fake.rejects(error);
    const getFake = fake.returns({
      listen: listenFake,
    });
    const streamFake = fake.returns({
      get: getFake,
    });
    const serverFake = fake.returns({
      get: streamFake,
    });
    replace(deps, "server", serverFake);

    try {
      await fact({ mainFn, queryAggregatesFn, aggregateFn });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
