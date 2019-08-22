const { expect } = require("chai");
const { objectArray } = require("..");

const validObjectArray = [{}, {}];
const invalidObjectArray = [{}, true];

describe("Valid object array", () => {
  it("should not contain errors if array has values that are objects", () => {
    const response = objectArray({ value: validObjectArray });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyObjectArray = [];
    const response = objectArray({ value: emptyObjectArray });
    expect(response.errors).to.be.empty;
  });
});

describe("Optional object array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = objectArray({ value: validObjectArray, optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = objectArray({ value: null, optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid object array", () => {
  it("should contain one error if array has values that are not objects", () => {
    const response = objectArray({ value: invalidObjectArray });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Invalid optional object array", () => {
  it("should contain one error if array has values that are not objects, regardless of optional flag", () => {
    const response = objectArray({
      value: invalidObjectArray,
      optional: true
    });
    expect(response.errors).to.have.lengthOf(1);
  });
});
