import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import deps from "../deps.js";
import fact from "../index.js";

chai.use(sinonChai);
const { expect } = chai;

const mainFn = "some-main-fn";
const queryAggregatesFn = "some-query-aggregates-fn";
const readFactFn = "some-read-fact-fn";
const streamFactFn = "some-stream-fact-fn";
const aggregateFn = "some-aggregate-fn";
const contexts = "some-contexts";

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
      readFactFn,
      streamFactFn,
      aggregateFn,
      contexts,
    });

    expect(result).to.equal(returnValue);
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith();
    expect(getFake).to.have.been.calledWith(factGetResult, { path: "/:root?" });
    expect(streamFake).to.have.been.calledWith(factStreamResult, {
      path: "/stream/:root?",
    });
    expect(factGetFake).to.have.been.calledWith({
      mainFn,
      queryAggregatesFn,
      aggregateFn,
      readFactFn,
      streamFactFn,
      contexts,
    });
    expect(factStreamFake).to.have.been.calledWith({
      mainFn,
      queryAggregatesFn,
      aggregateFn,
      readFactFn,
      streamFactFn,
      contexts,
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
