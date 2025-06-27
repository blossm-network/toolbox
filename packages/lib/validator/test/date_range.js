import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

describe("Valid date", () => {
  it("should not contain errors if the number is within range", () => {
    const validNumber = 5;
    const response = validator.dateRange(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid date", () => {
  it("should contain one error if the number is out of range", () => {
    const invalidNumber = 40;
    const response = validator.dateRange(invalidNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
