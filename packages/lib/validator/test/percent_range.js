import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

describe("Valid percent", () => {
  it("should not contain errors if the number is within range", () => {
    const validNumber = 500;
    const response = validator.percentRange(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid percent", () => {
  it("should contain one error if the number is out of range", () => {
    const invalidNumber = 10001;
    const response = validator.percentRange(invalidNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
