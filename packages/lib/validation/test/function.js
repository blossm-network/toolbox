const { expect } = require("chai");
const { fn } = require("..");

const invalidFunctions = ["hello", 0, false, {}];
const validFunction = () => {};

describe("Valid functions", () => {
  it("should not contain errors if value is not empty", () => {
    const response = fn({ value: validFunction });
    expect(response.errors).to.be.empty;
  });
});

describe("Optional functions", () => {
  it("should not contain errors if value is not empty", () => {
    const response = fn({ value: validFunction, optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = fn({ value: validFunction, optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid function", () => {
  it("should contain one error if something other than a func is passed in", () => {
    invalidFunctions.forEach(invalidFunction => {
      let response = fn({ value: invalidFunction });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
  it("should contain one error if something other than a func is passed in with message", () => {
    const message = "This is a bad fn";
    invalidFunctions.forEach(invalidFunction => {
      let response = fn({
        value: invalidFunction,
        baseMessageFn: () => message
      });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.equal(message);
    });
  });
  it("should contain one error if something other than a func is passed in with message and title", () => {
    const title = "some-title";
    invalidFunctions.forEach(invalidFunction => {
      let response = fn({
        title,
        value: invalidFunction,
        baseMessageFn: (e, title) => {
          expect(e).to.exist;
          return title;
        }
      });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.equal(title);
    });
  });
  it("should contain one error if something other than a func is passed in with title response", () => {
    const title = "some-title";
    invalidFunctions.forEach(invalidFunction => {
      let response = fn({ value: invalidFunction, title });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.include(title);
    });
  });
});

describe("Invalid optional function", () => {
  it("should contain one error if something other than a function is passed in, regardless of optional flag", () => {
    invalidFunctions.forEach(invalidFunction => {
      let response = fn({ value: invalidFunction, optional: true });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid function is passed in", () => {
    const incorrectFn = () => false;
    const refinementFn = value => value();
    const message = "This is a bad function";
    const response = fn({
      value: incorrectFn,
      refinementMessageFn: () => message,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(message);
  });

  it("should contain one error with the specified message if an invalid function is passed in with title", () => {
    const incorrectFn = () => false;
    const refinementFn = value => value();
    const title = "some-title";
    const response = fn({
      title,
      value: incorrectFn,
      refinementMessageFn: (value, title) => `${value}${title}`,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(`${incorrectFn}${title}`);
  });

  it("should throw an error with the thrown message if an invalid function is passed in without a message and the refinement function throws", () => {
    const message = "This is a bad function";
    const refinementFn = () => {
      throw message;
    };

    const response = fn({ value: validFunction, refinementFn });

    expect(response.errors[0].message).to.equal(message);
  });
  it("should throw an error with the passed in message if an invalid function is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad function";
    const refinementFn = () => {
      throw "bogus";
    };

    const response = fn({
      value: validFunction,
      refinementMessageFn: () => message,
      refinementFn
    });

    expect(response.errors[0].message).to.equal(message);
  });
});
