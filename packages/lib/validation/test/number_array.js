const { expect } = require("chai");
const { numberArray } = require("..");

const validNumberArray = [0, 1];
const invalidNumberArray = ["Hello", 0];

describe("Valid number array", () => {
  it("should not contain errors if array has values that are numbers", () => {
    const response = numberArray({ value: validNumberArray });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyNumberArray = [];
    const response = numberArray({ value: emptyNumberArray });
    expect(response.errors).to.be.empty;
  });
});

describe("Optional number array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = numberArray({ value: validNumberArray, optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = numberArray({ value: null, optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid number array", () => {
  it("should contain one error if array has values that are not numbers", () => {
    const response = numberArray({ value: invalidNumberArray });
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if array has values that are not numbers with message", () => {
    const message = "This is a bad number";
    const response = numberArray({
      value: invalidNumberArray,
      baseMessageFn: () => message
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(message);
  });
  it("should contain one error if array has values that are not numbers with message, title, and path", () => {
    const title = "some-title";
    const path = "some-path";
    const response = numberArray({
      title,
      path,
      value: invalidNumberArray,
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
    const message = "This is a bad number";
    const response = numberArray({
      value: 3,
      baseMessageFn: () => message
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(message);
  });
  it("should contain one error if array has values that are not numbers with title response", () => {
    const title = "some-title";
    let response = numberArray({ value: invalidNumberArray, title });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.include(title);
  });
});

describe("Invalid optional number array", () => {
  it("should contain one error if array has values that are not numbers, regardless of optional flag", () => {
    const response = numberArray({ value: invalidNumberArray, optional: true });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid number array is passed in", () => {
    const incorrectNumberArray = [0];
    const refinementFn = value => value[0] != 0;
    const message = "This is a bad number array";
    const response = numberArray({
      value: incorrectNumberArray,
      refinementMessageFn: () => message,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(message);
  });

  it("should contain one error with the specified message if an invalid number array is passed in with title", () => {
    const incorrectNumberArray = [0];
    const refinementFn = value => value[0] != 0;
    const title = "some-title";
    const response = numberArray({
      title,
      value: incorrectNumberArray,
      refinementMessageFn: (value, title) => `${value}${title}`,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(
      `${incorrectNumberArray}${title}`
    );
  });

  it("should throw an error with the thrown message if an invalid number array is passed in and the refinement function throws", () => {
    const message = "This is a bad number array";
    const refinementFn = () => {
      throw message;
    };

    const response = numberArray({ value: validNumberArray, refinementFn });

    expect(response.errors[0].message).to.equal(message);
  });

  it("should throw an error with the passed in message if an invalid number array is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad number array";
    const refinementFn = () => {
      throw "bogus";
    };

    const response = numberArray({
      value: validNumberArray,
      refinementMessageFn: () => message,
      refinementFn
    });

    expect(response.errors[0].message).to.equal(message);
  });
});
