import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

const validObjectArray = [{}, {}];
const invalidObjectArray = [{}, true];

describe("Valid object array", () => {
  it("should not contain errors if array has values that are objects", () => {
    const response = validator.objectArray(validObjectArray);
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyObjectArray = [];
    const response = validator.objectArray(emptyObjectArray);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional object array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = validator.objectArray(validObjectArray, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = validator.objectArray(null, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid object array", () => {
  it("should contain one error if array has values that are not objects", () => {
    const response = validator.objectArray(invalidObjectArray);
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Invalid optional object array", () => {
  it("should contain one error if array has values that are not objects, regardless of optional flag", () => {
    const response = validator.objectArray(invalidObjectArray, {
      optional: true,
    });
    expect(response.errors).to.have.lengthOf(1);
  });
});
