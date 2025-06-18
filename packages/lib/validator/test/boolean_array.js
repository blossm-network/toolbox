import * as chai from "chai";
import { booleanArray } from "../index.js";

const { expect } = chai;

const validBooleanArray = [false, true];
const invalidBooleanArray = ["Hello", true];

describe("Valid boolean array", () => {
  it("should not contain errors if array has values that are booleans", () => {
    const response = booleanArray(validBooleanArray);
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyBooleanArray = [];
    const response = booleanArray(emptyBooleanArray);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional boolean array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = booleanArray(validBooleanArray, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = booleanArray(null, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid boolean array", () => {
  it("should contain one error if array has values that are not booleans", () => {
    const response = booleanArray({ value: invalidBooleanArray });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Invalid optional boolean array", () => {
  it("should contain one error if array has values that are not booleans, regardless of optional flag", () => {
    const response = booleanArray({
      value: invalidBooleanArray,
      optional: true,
    });
    expect(response.errors).to.have.lengthOf(1);
  });
});
