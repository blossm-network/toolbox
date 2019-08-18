const { expect } = require("chai");
const { percentRange } = require("../index");

describe("Valid percent", () => {
  it("should not contain errors if the number is within range", () => {
    const validNumber = 500;
    const response = percentRange(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid percent", () => {
  it("should contain one error if the number is out of range", () => {
    const invalidNumber = 10001;
    const response = percentRange(invalidNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
