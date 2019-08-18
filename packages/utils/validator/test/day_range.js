const { expect } = require("chai");
const { dayRange } = require("../index");

describe("Valid day", () => {
  it("should not contain errors if the number is within range", () => {
    const validNumber = 5;
    const response = dayRange(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid day", () => {
  it("should contain one error if the number is out of range", () => {
    const invalidNumber = 10;
    const response = dayRange(invalidNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
