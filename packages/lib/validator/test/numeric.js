import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

describe("Valid numeric", () => {
  it("should not contain errors if the numeric is formatted correctly", () => {
    const validNumeric = "12323";
    const response = validator.numeric(validNumeric);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid numeric", () => {
  it("should contain one error if the value contains something other than a number", () => {
    const badNumeric = "1!3";
    const response = validator.numeric(badNumeric);
    expect(response.errors).to.have.lengthOf(1);
  });
});
