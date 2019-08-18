const { expect } = require("chai");
const validate = require("../src/validate_hydrate");

const goodBody = {
  storeId: "some-store-id",
  root: "some-root"
};

describe("Validate hydrate", () => {
  it("should handle correct params correctly", async () => {
    expect(await validate(goodBody)).to.not.throw;
  });
  it("should throw if a bad storeId is passed", async () => {
    const body = {
      ...goodBody,
      storeId: ""
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no storeId is passed", async () => {
    const body = {
      ...goodBody,
      storeId: undefined
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
