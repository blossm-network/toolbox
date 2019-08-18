const { expect } = require("chai");
const { scheduleIntervalRange } = require("../index");

describe("Valid positive number", () => {
  it("should not contain errors if the number is within range", () => {
    const validNumber = 5;
    const response = scheduleIntervalRange(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid positive number", () => {
  it("should contain one error if the number is out of range", () => {
    const invalidNumber = 11;
    const response = scheduleIntervalRange(invalidNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
