const { expect } = require("chai");
const { object } = require("..");

const invalidObjects = ["hello", 0, () => 0, false];
const validObject = { key: "value" };

describe("Valid objects", () => {
  it("should not contain errors if value is not empty", () => {
    const response = object(validObject);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional objects", () => {
  it("should not contain errors if value is not empty", () => {
    const response = object(validObject, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = object(null, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid object", () => {
  it("should contain one error if something other than a object is passed in", () => {
    invalidObjects.forEach(invalidObject => {
      let response = object(invalidObject);
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});

describe("Invalid optional object", () => {
  it("should contain one error if something other than a object is passed in, regardless of optional flag", () => {
    invalidObjects.forEach(invalidObject => {
      let response = object(invalidObject, { optional: true });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});
