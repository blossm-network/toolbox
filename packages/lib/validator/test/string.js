const { expect } = require("chai");
const { string } = require("..");

const invalidStrings = [0, true, () => 0, {}];
const validString = "Hello";

describe("Valid strings", () => {
  it("should not contain errors if value is not empty", () => {
    const response = string(validString);
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is empty", () => {
    const emptyString = "";
    const response = string(emptyString);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional strings", () => {
  it("should not contain errors if value is not empty", () => {
    const response = string(validString, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = string(null, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Max length strings", () => {
  it("should contain one error if the maxLength is violated.", () => {
    const response = string("aaa", { maxLength: 2 });
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain errors if maxLength is violated with optional", () => {
    const response = string("aaa", { optional: true, maxLength: 2 });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Custom fn strings", () => {
  it("should contain one error if the fn is violated.", () => {
    const response = string("aaa", { fn: () => false });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Empty strings", () => {
  it("should contain one error if the empty string flag violated.", () => {
    const response = string("", { shouldAllowEmptyString: false });
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if the empty string flag violated.", () => {
    const response = string("", {});
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid string", () => {
  it("should contain one error if something other than a string is passed in", () => {
    invalidStrings.forEach(invalidString => {
      let response = string(invalidString);
      expect(response.errors).to.have.lengthOf(1);
    });
  });
  it("should contain one error if something other than a string is passed in with a title", () => {
    const title = "some-title";
    invalidStrings.forEach(invalidString => {
      let response = string(invalidString, { title });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.include(title);
    });
  });
});

describe("Invalid optional string", () => {
  it("should contain one error if something other than a string is passed in, regardless of optional flag", () => {
    invalidStrings.forEach(invalidString => {
      let response = string(invalidString, { optional: true });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});
