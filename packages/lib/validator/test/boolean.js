import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

const invalidBooleans = ["hello", 0, () => 0, {}];
const validBoolean = false;

describe("Valid booleans", () => {
  it("should not contain errors if value is not empty", () => {
    const response = validator.boolean(validBoolean);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional booleans", () => {
  it("should not contain errors if value is not empty", () => {
    const response = validator.boolean(validBoolean, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = validator.boolean(null, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid boolean", () => {
  it("should contain one error if something other than a boolean is passed in", () => {
    invalidBooleans.forEach((invalidBoolean) => {
      let response = validator.boolean(invalidBoolean);
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});

describe("Invalid optional boolean", () => {
  it("should contain one error if something other than a boolean is passed in, regardless of optional flag", () => {
    invalidBooleans.forEach((invalidBoolean) => {
      let response = validator.boolean(invalidBoolean, { optional: true });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});
