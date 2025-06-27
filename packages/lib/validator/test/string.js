import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

const invalidStrings = [0, true, () => 0, {}];
const validString = "Hello";

describe("Valid strings", () => {
  it("should not contain errors if value is not empty", () => {
    const response = validator.string(validString);
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is empty", () => {
    const emptyString = "";
    const response = validator.string(emptyString);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional strings", () => {
  it("should not contain errors if value is not empty", () => {
    const response = validator.string(validString, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = validator.string(null, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Max length strings", () => {
  it("should contain one error if the maxLength is violated.", () => {
    const response = validator.string("aaa", { maxLength: 2 });
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain errors if maxLength is violated with optional", () => {
    const response = validator.string("aaa", { optional: true, maxLength: 2 });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Custom fn strings", () => {
  it("should contain one error if the fn is violated.", () => {
    const response = validator.string("aaa", { fn: () => false });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Empty strings", () => {
  it("should contain one error if the empty string flag violated.", () => {
    const response = validator.string("", { shouldAllowEmptyString: false });
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if the empty string flag violated.", () => {
    const response = validator.string("", {});
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid string", () => {
  it("should contain one error if something other than a string is passed in", () => {
    invalidStrings.forEach((invalidString) => {
      let response = validator.string(invalidString);
      expect(response.errors).to.have.lengthOf(1);
    });
  });
  it("should contain one error if something other than a string is passed in with a title", () => {
    const title = "some-title";
    invalidStrings.forEach((invalidString) => {
      let response = validator.string(invalidString, { title });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.include(title);
    });
  });
});

describe("Invalid optional string", () => {
  it("should contain one error if something other than a string is passed in, regardless of optional flag", () => {
    invalidStrings.forEach((invalidString) => {
      let response = validator.string(invalidString, { optional: true });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});
