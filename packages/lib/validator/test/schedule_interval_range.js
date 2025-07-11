import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

describe("Valid positive number", () => {
  it("should not contain errors if the number is within range", () => {
    const validNumber = 5;
    const response = validator.scheduleIntervalRange(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid positive number", () => {
  it("should contain one error if the number is out of range", () => {
    const invalidNumber = 11;
    const response = validator.scheduleIntervalRange(invalidNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
