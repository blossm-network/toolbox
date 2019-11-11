const { expect } = require("chai");
const { stringArray } = require("..");

const validStringArray = ["Hello", "Hi"];
const invalidStringArray = ["Hello", 0];

describe("Valid string array", () => {
  it("should not contain errors if array has values that are strings", () => {
    const response = stringArray({ value: validStringArray });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyStringArray = [];
    const response = stringArray({ value: emptyStringArray });
    expect(response.errors).to.be.empty;
  });
});

describe("Optional string array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = stringArray({ value: validStringArray, optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = stringArray({ value: null, optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid string array", () => {
  it("should contain one error if array has values that are not strings", () => {
    const response = stringArray({ value: invalidStringArray });
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if array has values that are not strings with message", () => {
    const message = "This is a bad string";
    const response = stringArray({
      value: invalidStringArray,
      baseMessageFn: () => message
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(message);
  });
  it("should contain one error if array has values that are not strings with message and title", () => {
    const title = "some-title";
    const response = stringArray({
      title,
      value: invalidStringArray,
      baseMessageFn: (e, title) => {
        expect(e).to.exist;
        return title;
      }
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(title);
  });
  it("should contain one error if not array with message", () => {
    const message = "This is a bad string";
    const response = stringArray({
      value: 3,
      baseMessageFn: () => message
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(message);
  });
  it("should contain one error if array has values that are not strings with title response", () => {
    const title = "some-title";
    let response = stringArray({ value: invalidStringArray, title });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.include(title);
  });
});

describe("Invalid optional string array", () => {
  it("should contain one error if array has values that are not strings, regardless of optional flag", () => {
    const response = stringArray({ value: invalidStringArray, optional: true });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid string array is passed in", () => {
    const incorrectStringArray = ["some"];
    const refinementFn = value => value[0] != "some";
    const message = "This is a bad string";
    const response = stringArray({
      value: incorrectStringArray,
      refinementMessageFn: () => message,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(message);
  });

  it("should contain one error with the specified message if an invalid string array is passed in with title", () => {
    const incorrectStringArray = ["some"];
    const refinementFn = value => value[0] != "some";
    const title = "some-title";
    const response = stringArray({
      title,
      value: incorrectStringArray,
      refinementMessageFn: (value, title) => `${value}${title}`,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(
      `${incorrectStringArray}${title}`
    );
  });

  it("should throw an error with the thrown message if an invalid string array is passed in without a message and the refinement function throws", () => {
    const message = "This is a bad string array";
    const refinementFn = () => {
      throw message;
    };

    const response = stringArray({ value: validStringArray, refinementFn });

    expect(response.errors[0].message).to.equal(message);
  });
  it("should throw an error with the passed in message if an invalid string array is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad string array";
    const refinementFn = () => {
      throw "bogus";
    };

    const response = stringArray({
      value: validStringArray,
      refinementMessageFn: () => message,
      refinementFn
    });

    expect(response.errors[0].message).to.equal(message);
  });
});
