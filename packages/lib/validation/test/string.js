const { expect } = require("chai");
const { string } = require("../index");

const invalidStrings = [0, true, () => 0, {}];
const validString = "Hi there";

describe("Valid strings", () => {
  it("should not contain errors if value is not empty", () => {
    const response = string({ value: validString });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is empty", () => {
    const emptyString = "";
    const response = string({ value: emptyString });
    expect(response.errors).to.be.empty;
  });
});

describe("Optional strings", () => {
  it("should not contain errors if value is not empty", () => {
    const response = string({ value: validString, optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = string({ value: null, optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Refinement functions", () => {
  it("should not contain errors if value is not empty and passes refinement function", () => {
    const fn = value => value == validString;
    const response = string({ value: validString, fn });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid string", () => {
  it("should contain one error if something other than a string is passed in", () => {
    invalidStrings.forEach(invalidString => {
      let response = string({ value: invalidString });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});

describe("Invalid optional string", () => {
  it("should contain one error if something other than a string is passed in, regardless of optional flag", () => {
    invalidStrings.forEach(invalidString => {
      let response = string({ value: invalidString, optional: true });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});

describe("Valid string that doesn't satisfy refinement", () => {
  it("should contain one error if a string is passed in that doesn't satisfy the refinement function", () => {
    const fn = value => value != validString;
    const response = string({ value: validString, fn });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid string is passed in", () => {
    const incorrectString = validString;
    const fn = value => value != validString;
    const message = "This is a bad string";
    const response = string({
      value: incorrectString,
      message: () => message,
      fn
    });
    expect(response.errors[0].message).to.equal(message);
  });

  it("should throw an error with the thrown message if an invalid string is passed in without a message and the refinement function throws", () => {
    const message = "This is a bad string";
    const fn = () => {
      throw message;
    };

    const response = string({ value: validString, fn });

    expect(response.errors[0].message).to.equal(message);
  });
  it("should throw an error with the passed in message if an invalid string is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad string";
    const fn = () => {
      throw "bogus";
    };

    const response = string({ value: validString, message: () => message, fn });

    expect(response.errors[0].message).to.equal(message);
  });
});
