const { expect } = require("chai");
const { monthRange } = require("../index");

describe("Valid month", () => {
  it("should not contain errors if the number is within range", () => {
    const validNumber = 5;
    const response = monthRange(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid month", () => {
  it("should contain one error if the number is out of range", () => {
    const invalidNumber = 15;
    const response = monthRange(invalidNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
