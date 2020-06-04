const { expect } = require("chai").use(require("sinon-chai"));
const { restore } = require("sinon");

const operationUrl = require("..");

const host = "some-host";
const path = "/some-path";
const id = "some-id";

describe("Service url", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "some-env";
  });
  afterEach(restore);
  it("should return the correct output", () => {
    const result = operationUrl({ host, path, id });
    expect(result).to.equal(`https://some-host/some-path/some-id`);
  });
  it("should return the correct output in local env", () => {
    process.env.NODE_ENV = "local";
    const result = operationUrl({ host, path, id });
    expect(result).to.equal(`http://some-host/some-path/some-id`);
  });
  it("should return the correct output with no path", () => {
    const result = operationUrl({ host, id });
    expect(result).to.equal(`https://some-host/some-id`);
  });
  it("should return the correct output with no path or id", () => {
    const result = operationUrl({ host });
    expect(result).to.equal(`https://some-host`);
  });
});
