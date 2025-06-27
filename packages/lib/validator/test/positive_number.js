import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

describe("Valid positive number", () => {
  it("should not contain errors if the number is positive", () => {
    const validNumber = 10;
    const response = validator.positiveNumber(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid positive", () => {
  it("should contain one error if the number is negative", () => {
    const invalidNumber = -1;
    const response = validator.positiveNumber(invalidNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
