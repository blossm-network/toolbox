const { expect } = require("chai");
const { numberArray } = require("../index");

const validNumberArray = [0, 1];
const invalidNumberArray = ["Hello", 0];

describe("Valid number array", () => {
  it("should not contain errors if array has values that are numbers", () => {
    const response = numberArray({ value: validNumberArray });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyNumberArray = [];
    const response = numberArray({ value: emptyNumberArray });
    expect(response.errors).to.be.empty;
  });
});

describe("Optional number array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = numberArray({ value: validNumberArray, optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = numberArray({ value: null, optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid number array", () => {
  it("should contain one error if array has values that are not numbers", () => {
    const response = numberArray({ value: invalidNumberArray });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Invalid optional number array", () => {
  it("should contain one error if array has values that are not numbers, regardless of optional flag", () => {
    const response = numberArray({ value: invalidNumberArray, optional: true });
    expect(response.errors).to.have.lengthOf(1);
  });
});
