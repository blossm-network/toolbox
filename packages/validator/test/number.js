const { expect } = require("chai");
const { number } = require("..");

const invalidNumbers = ["hello", true, () => 0, {}];
const validNumber = 0;

describe("Valid numbers", () => {
  it("should not contain errors if value is not empty", () => {
    const response = number(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional numbers", () => {
  it("should not contain errors if value is not empty", () => {
    const response = number(validNumber, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = number(null, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid number", () => {
  it("should contain one error if something other than a number is passed in", () => {
    invalidNumbers.forEach(invalidNumber => {
      let response = number(invalidNumber);
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});

describe("Invalid optional number", () => {
  it("should contain one error if something other than a number is passed in, regardless of optional flag", () => {
    invalidNumbers.forEach(invalidNumber => {
      let response = number(invalidNumber, { optional: true });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});
