import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

describe("Valid month", () => {
  it("should not contain errors if the number is within range", () => {
    const validNumber = 5;
    const response = validator.monthRange(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid month", () => {
  it("should contain one error if the number is out of range", () => {
    const invalidNumber = 15;
    const response = validator.monthRange(invalidNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
