import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

const validNumberArray = [0, 1];
const invalidNumberArray = ["Hello", 0];

describe("Valid number array", () => {
  it("should not contain errors if array has values that are numbers", () => {
    const response = validator.numberArray(validNumberArray);
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyNumberArray = [];
    const response = validator.numberArray(emptyNumberArray);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional number array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = validator.numberArray(validNumberArray, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = validator.numberArray(null, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid number array", () => {
  it("should contain one error if array has values that are not numbers", () => {
    const response = validator.numberArray(invalidNumberArray);
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Invalid optional number array", () => {
  it("should contain one error if array has values that are not numbers, regardless of optional flag", () => {
    const response = validator.numberArray(invalidNumberArray, { optional: true });
    expect(response.errors).to.have.lengthOf(1);
  });
});
