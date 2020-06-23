const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const operationEnqueue = require("..");
const deps = require("../deps");

const hash = 12345;
const operation0 = "some-operation0";
const operation1 = "some-operation1";
const operation2 = "some-operation2";
const operation = [operation0, operation1, operation2];
const trimmed = "some-trimmed";
const url = "some-url";
const data = "some-data";
const token = "some-token";

describe("Service token", () => {
  afterEach(restore);
  it("should return the correct output", async () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const enqueueFnFake = fake.returns(token);

    const result = await operationEnqueue({
      url,
      data,
      enqueueFn: enqueueFnFake,
      operation,
    });
    expect(hashFake).to.have.been.calledWith(...operation);
    expect(trimFake).to.have.been.calledWith(
      "some-operation2-some-operation1-some-operation0",
      25
    );
    //doesn't mutate the origianl operation.
    expect(operation).to.deep.equal([
      "some-operation0",
      "some-operation1",
      "some-operation2",
    ]);
    expect(enqueueFnFake).to.have.been.calledWith({
      url,
      data,
      hash,
      name: trimmed,
    });
    expect(result).to.equal(token);
  });
});
