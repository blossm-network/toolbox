const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const serviceHash = require("..");
const deps = require("../deps");

const hash = 12345;
const operation0 = "some-operation0";
const operation1 = "some-operation1";
const operation2 = "some-operation2";
const operation = [operation0, operation1, operation2];
const service = "some-service";

describe("Service hash", () => {
  afterEach(restore);
  it("should return the correct output", () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const result = serviceHash({ operation, service });
    expect(hashFake).to.have.been.calledWith(
      `${operation0}${operation1}${operation2}${service}`
    );
    expect(result).to.equal("12345");
  });
});
