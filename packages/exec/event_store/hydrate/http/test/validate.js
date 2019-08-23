const { expect } = require("chai");
const validate = require("../src/validate");

const goodParams = {
  domain: "some-domain",
  service: "some-service",
  root: "some-root"
};

describe("Validate hydrate", () => {
  it("should handle correct params correctly", async () => {
    expect(await validate(goodParams)).to.not.throw;
  });
  it("should throw if a bad domain is passed", async () => {
    const params = {
      ...goodParams,
      domain: ""
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no domain is passed", async () => {
    const params = {
      ...goodParams,
      domain: undefined
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if a bad service is passed", async () => {
    const params = {
      ...goodParams,
      service: ""
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no service is passed", async () => {
    const params = {
      ...goodParams,
      service: undefined
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if a bad root is passed", async () => {
    const params = {
      ...goodParams,
      root: 123
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no root is passed", async () => {
    const params = {
      ...goodParams,
      root: undefined
    };

    expect(async () => await validate(params)).to.throw;
  });
});
