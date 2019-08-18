const { expect } = require("chai");
const { fnArray } = require("../index");

const validFunctionArray = [() => {}, () => {}];
const invalidFunctionArray = ["Hello", () => {}];

describe("Valid function array", () => {
  it("should not contain errors if array has values that are functions", () => {
    const response = fnArray(validFunctionArray);
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyFunctionArray = [];
    const response = fnArray(emptyFunctionArray);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional function array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = fnArray(validFunctionArray, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = fnArray(null, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid function array", () => {
  it("should contain one error if array has values that are not functions", () => {
    const response = fnArray(invalidFunctionArray);
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Invalid optional function array", () => {
  it("should contain one error if array has values that are not functions, regardless of optional flag", () => {
    const response = fnArray(invalidFunctionArray, {
      optional: true
    });
    expect(response.errors).to.have.lengthOf(1);
  });
});
