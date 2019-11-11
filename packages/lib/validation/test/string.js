const { expect } = require("chai");
const { string } = require("..");

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
  it("should contain one error if something other than a string is passed in with message", () => {
    const message = "This is a bad string";
    invalidStrings.forEach(invalidString => {
      let response = string({
        value: invalidString,
        baseMessageFn: () => message
      });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.equal(message);
    });
  });
  it("should contain one error if something other than a string is passed in with message, title, and path", () => {
    const title = "some-title";
    const path = "some-path";
    invalidStrings.forEach(invalidString => {
      let response = string({
        title,
        path,
        value: invalidString,
        baseMessageFn: (e, title) => {
          expect(e).to.exist;
          return title;
        }
      });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.equal(title);
      expect(response.errors[0].path[0]).to.equal(path);
    });
  });
  it("should contain one error if something other than a string is passed in with title response", () => {
    const title = "some-title";
    invalidStrings.forEach(invalidString => {
      let response = string({ value: invalidString, title });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.include(title);
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
    const refinementFn = value => value != validString;
    const response = string({ value: validString, refinementFn });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid string is passed in", () => {
    const incorrectString = validString;
    const refinementFn = value => value != validString;
    const message = "This is a bad string";
    const response = string({
      value: incorrectString,
      refinementMessageFn: () => message,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(message);
  });

  it("should contain one error with the specified message if an invalid string is passed in with title", () => {
    const incorrectString = validString;
    const refinementFn = value => value != validString;
    const title = "some-title";
    const response = string({
      title,
      value: incorrectString,
      refinementMessageFn: (value, title) => `${value}${title}`,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(`${incorrectString}${title}`);
  });

  it("should throw an error with the thrown message if an invalid string is passed in without a message and the refinement function throws", () => {
    const message = "This is a bad string";
    const refinementFn = () => {
      throw message;
    };

    const response = string({ value: validString, refinementFn });

    expect(response.errors[0].message).to.equal(message);
  });
  it("should throw an error with the passed in message if an invalid string is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad string";
    const refinementFn = () => {
      throw "bogus";
    };

    const response = string({
      value: validString,
      refinementMessageFn: () => message,
      refinementFn
    });

    expect(response.errors[0].message).to.equal(message);
  });
});
