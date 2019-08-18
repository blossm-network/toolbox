const { expect } = require("chai");
const { numberRange } = require("../index");

const bounds = { lowerBound: 2, upperBound: 3 };

describe("Valid range", () => {
  it("should not contain errors if the number is in range", () => {
    const response = numberRange(2, bounds);
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if the number is the lower bound", () => {
    const response = numberRange(2, bounds);
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if the number is the upper bound", () => {
    const response = numberRange(3, bounds);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional range", () => {
  it("should not contain errors if the value is null", () => {
    const response = numberRange(null, {
      upperBound: 1,
      lowerBound: 0,
      optional: true
    });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid range", () => {
  it("should contain one error if the number is too large", () => {
    const response = numberRange(4, bounds);
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if the number is too small", () => {
    const response = numberRange(1, bounds);
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if the number is invalid, regardless of the optional flag", () => {
    const response = numberRange(1, {
      upperBound: 3,
      lowerBound: 2,
      optional: true
    });
    expect(response.errors).to.have.lengthOf(1);
  });
});
