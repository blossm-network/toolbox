const { expect } = require("chai");
const { uuid } = require("..");

describe("Valid uuid", () => {
  it("should not contain errors if the uuid is formatted correctly", () => {
    const validUuid = "c51c80c2-66a1-442a-91e2-4f55b4256a72";
    const response = uuid(validUuid);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid uuid", () => {
  it("should contain one error if the uuid isn't formatted correctly", () => {
    const invalidUuid = "bad";
    const response = uuid(invalidUuid);
    expect(response.errors).to.have.lengthOf(1);
  });
});
