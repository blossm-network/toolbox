const { expect } = require("chai");
const { fn } = require("..");

const invalidFunctions = ["hello", 0, false, {}];
const validFunction = () => {};

describe("Valid functions", () => {
  it("should not contain errors if value is not empty", () => {
    const response = fn(validFunction);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional functions", () => {
  it("should not contain errors if value is not empty", () => {
    const response = fn(validFunction, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = fn(validFunction, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid function", () => {
  it("should contain one error if something other than a func is passed in", () => {
    invalidFunctions.forEach((invalidFunction) => {
      let response = fn(invalidFunction);
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});

describe("Invalid optional function", () => {
  it("should contain one error if something other than a function is passed in, regardless of optional flag", () => {
    invalidFunctions.forEach((invalidFunction) => {
      let response = fn(invalidFunction, { optional: true });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});
