const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const operationUrl = require("..");
const deps = require("../deps");

const hash = 12345;
const operation = "some-operation";
const host = "some-host";
const path = "/some-path";
const id = "some-id";

describe("Service url", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "some-env";
  });
  afterEach(restore);
  it("should return the correct output", () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const result = operationUrl({ operation, host, path, id });
    expect(hashFake).to.have.been.calledWith(...operation);
    expect(result).to.equal(`https://${hash}.some-host/some-path/some-id`);
  });
  it("should return the correct output in local env", () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    process.env.NODE_ENV = "local";
    const result = operationUrl({ operation, host, path, id });
    expect(hashFake).to.have.been.calledWith(...operation);
    expect(result).to.equal(`http://${hash}.some-host/some-path/some-id`);
  });
  it("should return the correct output with no path", () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const result = operationUrl({ operation, host, id });
    expect(hashFake).to.have.been.calledWith(...operation);
    expect(result).to.equal(`https://${hash}.some-host/some-id`);
  });
  it("should return the correct output with no path or id", () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const result = operationUrl({ operation, host });
    expect(hashFake).to.have.been.calledWith(...operation);
    expect(result).to.equal(`https://${hash}.some-host`);
  });
});
