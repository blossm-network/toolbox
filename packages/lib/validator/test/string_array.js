import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

const validStringArray = ["Hello", "Hi"];
const invalidStringArray = ["Hello", 0];

describe("Valid string array", () => {
  it("should not contain errors if array has values that are strings", () => {
    const response = validator.stringArray(validStringArray);
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyStringArray = [];
    const response = validator.stringArray(emptyStringArray);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional string array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = validator.stringArray(validStringArray, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = validator.stringArray(null, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid string array", () => {
  it("should contain one error if array has values that are not strings", () => {
    const response = validator.stringArray(invalidStringArray);
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Invalid optional string array", () => {
  it("should contain one error if array has values that are not strings, regardless of optional flag", () => {
    const response = validator.stringArray(invalidStringArray, { optional: true });
    expect(response.errors).to.have.lengthOf(1);
  });
});
