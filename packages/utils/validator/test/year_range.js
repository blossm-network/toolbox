const { expect } = require("chai");
const { yearRange } = require("../index");

describe("Valid year", () => {
  it("should not contain errors if the number is within range", () => {
    const validNumber = 2019;
    const response = yearRange(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid year", () => {
  it("should contain one error if the number is out of range", () => {
    const invalidNumber = 2050;
    const response = yearRange(invalidNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
