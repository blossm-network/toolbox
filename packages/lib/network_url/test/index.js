const { expect } = require("chai").use(require("sinon-chai"));
const { restore } = require("sinon");

const operationUrl = require("..");

const host = "some-host";
const path = "/some-path";
const root = "some-root";

describe("Service url", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "some-env";
  });
  afterEach(restore);
  it("should return the correct output", () => {
    const result = operationUrl({ host, path, root });
    expect(result).to.equal(`https://some-host/some-path/some-root`);
  });
  it("should return the correct output with no path", () => {
    const result = operationUrl({ host, root });
    expect(result).to.equal(`https://some-host/some-root`);
  });
  it("should return the correct output with no path or root", () => {
    const result = operationUrl({ host });
    expect(result).to.equal(`https://some-host`);
  });
});
