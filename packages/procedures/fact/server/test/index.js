const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const job = require("..");

const mainFn = "some-main-fn";

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

    const jobGetResult = "some-get-result";
    const jobGetFake = fake.returns(jobGetResult);
    replace(deps, "get", jobGetFake);

    const result = await job({
      mainFn,
    });

    expect(result).to.equal(returnValue);
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith();
    expect(getFake).to.have.been.calledWith(jobGetResult, { path: "/:root?" });
    expect(jobGetFake).to.have.been.calledWith({ mainFn });
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

    const jobGetResult = "some-get-result";
    const jobGetFake = fake.returns(jobGetResult);
    replace(deps, "get", jobGetFake);

    try {
      await job({ mainFn });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
