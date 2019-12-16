const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const serviceUrl = require("..");
const deps = require("../deps");

const hash = 12345;
const procedure = "some-procedure";
const service = "some-service";
const network = "some-network";
const path = "/some-path";
const root = "some-root";

describe("Service url", () => {
  afterEach(restore);
  it("should return the correct output", () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const result = serviceUrl({ procedure, service, network, path, root });
    expect(hashFake).to.have.been.calledWith({ procedure, service });
    expect(result).to.equal(`http://${hash}.some-network/some-path/some-root`);
  });
  it("should return the correct output with no path", () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const result = serviceUrl({ procedure, service, network, root });
    expect(hashFake).to.have.been.calledWith({ procedure, service });
    expect(result).to.equal(`http://${hash}.some-network/some-root`);
  });
  it("should return the correct output with no path or root", () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const result = serviceUrl({ procedure, service, network });
    expect(hashFake).to.have.been.calledWith({ procedure, service });
    expect(result).to.equal(`http://${hash}.some-network`);
  });
});
