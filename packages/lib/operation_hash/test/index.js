const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const operationHash = require("..");
const deps = require("../deps");

const hash = 12345;
const operation0 = "some-operation0";
const operation1 = "some-operation1";
const operation2 = "some-operation2";

describe("Service hash", () => {
  afterEach(restore);
  it("should return the correct output", () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const result = operationHash(operation0, operation1, operation2);
    expect(hashFake).to.have.been.calledWith(
      `${operation0}${operation1}${operation2}`
    );
    expect(result).to.equal("12345");
  });
});
