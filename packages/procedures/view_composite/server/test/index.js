const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const composite = require("..");

const mainFn = "some-main-fn";
const viewsFn = "some-views-fn";

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
    const serverFake = fake.returns({
      get: getFake,
    });
    replace(deps, "server", serverFake);

    const compositeGetResult = "some-get-result";
    const compositeGetFake = fake.returns(compositeGetResult);
    replace(deps, "get", compositeGetFake);

    const result = await composite({
      mainFn,
      viewsFn,
    });

    expect(result).to.equal(returnValue);
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith();
    expect(getFake).to.have.been.calledWith(compositeGetResult);
    expect(compositeGetFake).to.have.been.calledWith({ mainFn, viewsFn });
  });
  it("should throw correctly", async () => {
    const error = new Error("some-message");
    const listenFake = fake.rejects(error);
    const getFake = fake.returns({
      listen: listenFake,
    });
    const serverFake = fake.returns({
      get: getFake,
    });
    replace(deps, "server", serverFake);

    const compositeGetResult = "some-get-result";
    const compositeGetFake = fake.returns(compositeGetResult);
    replace(deps, "get", compositeGetFake);

    try {
      await composite({ mainFn, viewsFn });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
