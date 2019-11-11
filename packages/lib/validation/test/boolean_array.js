const { expect } = require("chai");
const { booleanArray } = require("..");

const validBooleanArray = [false, true];
const invalidBooleanArray = ["Hello", true];

describe("Valid boolean array", () => {
  it("should not contain errors if array has values that are booleans", () => {
    const response = booleanArray({ value: validBooleanArray });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyBooleanArray = [];
    const response = booleanArray({ value: emptyBooleanArray });
    expect(response.errors).to.be.empty;
  });
});

describe("Optional boolean array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = booleanArray({ value: validBooleanArray, optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = booleanArray({ value: null, optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid boolean array", () => {
  it("should contain one error if array has values that are not booleans", () => {
    const response = booleanArray({ value: invalidBooleanArray });
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if array has values that are not booleans with message", () => {
    const message = "This is a bad boolean";
    const response = booleanArray({
      value: invalidBooleanArray,
      baseMessageFn: () => message
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(message);
  });
  it("should contain one error if array has values that are not booleans with message, title, and path", () => {
    const title = "some-title";
    const path = "some-path";
    const response = booleanArray({
      title,
      path,
      value: invalidBooleanArray,
      baseMessageFn: (e, title) => {
        expect(e).to.exist;
        return title;
      }
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(title);
    expect(response.errors[0].path[0]).to.equal(path);
  });
  it("should contain one error if not array with message", () => {
    const message = "This is a bad boolean";
    const response = booleanArray({
      value: 3,
      baseMessageFn: () => message
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(message);
  });
  it("should contain one error if array has values that are not booleans with title response", () => {
    const title = "some-title";
    const response = booleanArray({ value: invalidBooleanArray, title });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.include(title);
  });
});

describe("Invalid optional boolean array", () => {
  it("should contain one error if array has values that are not booleans, regardless of optional flag", () => {
    const response = booleanArray({
      value: invalidBooleanArray,
      optional: true
    });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid boolean is passed in", () => {
    const incorrectBooleanArray = [false];
    const refinementFn = value => value[0];
    const message = "This is a bad boolean array";
    const response = booleanArray({
      value: incorrectBooleanArray,
      refinementMessageFn: () => message,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(message);
  });

  it("should contain one error with the specified message if an invalid boolean array is passed in with title", () => {
    const incorrectBooleanArray = [false];
    const refinementFn = value => value[0];
    const title = "some-title";
    const response = booleanArray({
      title,
      value: incorrectBooleanArray,
      refinementMessageFn: (value, title) => `${value}${title}`,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(
      `${incorrectBooleanArray}${title}`
    );
  });

  it("should throw an error with the thrown message if an invalid boolean array is passed in and the refinement function throws", () => {
    const message = "This is a bad boolean array";
    const refinementFn = () => {
      throw message;
    };

    const response = booleanArray({
      value: validBooleanArray,
      refinementFn
    });

    expect(response.errors[0].message).to.equal(message);
  });

  it("should throw an error with the passed in message if an invalid boolean array is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad boolean array";
    const refinementFn = () => {
      throw "bogus";
    };

    const response = booleanArray({
      value: validBooleanArray,
      refinementMessageFn: () => message,
      refinementFn
    });

    expect(response.errors[0].message).to.equal(message);
  });
});
