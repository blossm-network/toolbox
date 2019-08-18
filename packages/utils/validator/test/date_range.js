const { expect } = require("chai");
const { dateRange } = require("../index");

describe("Valid date", () => {
  it("should not contain errors if the number is within range", () => {
    const validNumber = 5;
    const response = dateRange(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid date", () => {
  it("should contain one error if the number is out of range", () => {
    const invalidNumber = 40;
    const response = dateRange(invalidNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
