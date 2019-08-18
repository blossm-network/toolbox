const { expect } = require("chai");
const { stringArray } = require("../index");

const validStringArray = ["Hello", "Hi"];
const invalidStringArray = ["Hello", 0];

describe("Valid string array", () => {
  it("should not contain errors if array has values that are strings", () => {
    const response = stringArray(validStringArray);
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyStringArray = [];
    const response = stringArray(emptyStringArray);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional string array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = stringArray(validStringArray, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = stringArray(null, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid string array", () => {
  it("should contain one error if array has values that are not strings", () => {
    const response = stringArray(invalidStringArray);
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Invalid optional string array", () => {
  it("should contain one error if array has values that are not strings, regardless of optional flag", () => {
    const response = stringArray(invalidStringArray, { optional: true });
    expect(response.errors).to.have.lengthOf(1);
  });
});
