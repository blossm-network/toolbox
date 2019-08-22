const { expect } = require("chai");
const validate = require("../src/validate_hydrate");

const goodBody = {
  domain: "some-domain",
  service: "some-service",
  root: "some-root"
};

describe("Validate hydrate", () => {
  it("should handle correct params correctly", async () => {
    expect(await validate(goodBody)).to.not.throw;
  });
  it("should throw if a bad domain is passed", async () => {
    const body = {
      ...goodBody,
      domain: ""
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no domain is passed", async () => {
    const body = {
      ...goodBody,
      domain: undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad service is passed", async () => {
    const body = {
      ...goodBody,
      service: ""
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no service is passed", async () => {
    const body = {
      ...goodBody,
      service: undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad root is passed", async () => {
    const body = {
      ...goodBody,
      root: 123
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no root is passed", async () => {
    const body = {
      ...goodBody,
      root: undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
});
