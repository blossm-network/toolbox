import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

describe("Valid numbers equal", () => {
  it("should not contain errors if the two numbers are the same", () => {
    const response = validator.numbersEqual(2, 2);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid numbers equal", () => {
  it("should contain one error if the numbers do not equal", () => {
    const response = validator.numbersEqual(2, 3);
    expect(response.errors).to.have.lengthOf(1);
  });
});
