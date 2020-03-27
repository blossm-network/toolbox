const { expect } = require("chai").use(require("sinon-chai"));
const { fake } = require("sinon");

const operationToken = require("..");

const host = "some-host";
const token = "some-token";

describe("Service token", () => {
  it("should return the correct output", async () => {
    const tokenFnFake = fake.returns(token);

    const result = await operationToken({
      tokenFn: tokenFnFake,
      host
    });
    expect(tokenFnFake).to.have.been.calledWith({ host });
    expect(result).to.equal(token);
  });
  it("should return the correct output with no tokenFn", async () => {
    const result = await operationToken({});
    expect(result).to.be.null;
  });
});
