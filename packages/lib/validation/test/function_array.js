const { expect } = require("chai");
const { fnArray } = require("..");

const validFunctionArray = [() => {}, () => {}];
const invalidFunctionArray = ["Hello", () => {}];

describe("Valid function array", () => {
  it("should not contain errors if array has values that are functions", () => {
    const response = fnArray({ value: validFunctionArray });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyFunctionArray = [];
    const response = fnArray({ value: emptyFunctionArray });
    expect(response.errors).to.be.empty;
  });
});

describe("Optional function array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = fnArray({ value: validFunctionArray, optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = fnArray({ value: null, optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid function array", () => {
  it("should contain one error if array has values that are not functions", () => {
    const response = fnArray({ value: invalidFunctionArray });
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if array has values that are not functions with message", () => {
    const message = "This is a bad fn";
    const response = fnArray({
      value: invalidFunctionArray,
      baseMessageFn: () => message,
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(message);
  });
  it("should contain one error if array has values that are not functions with message, title, and path", () => {
    const title = "some-title";
    const path = "some-path";
    const response = fnArray({
      title,
      path,
      value: invalidFunctionArray,
      baseMessageFn: (e, title) => {
        expect(e).to.exist;
        return title;
      },
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(title);
    expect(response.errors[0].path[0]).to.equal(path);
  });
  it("should contain one error if not array with message", () => {
    const message = "This is a bad fn";
    const response = fnArray({
      value: 3,
      baseMessageFn: () => message,
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(message);
  });
  it("should contain one error if array has values that are not functions with title response", () => {
    const title = "some-title";
    let response = fnArray({ value: invalidFunctionArray, title });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.include(title);
  });
});

describe("Invalid optional function array", () => {
  it("should contain one error if array has values that are not functions, regardless of optional flag", () => {
    const response = fnArray({
      value: invalidFunctionArray,
      optional: true,
    });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid function array is passed in", () => {
    const incorrectFnArray = [() => false];
    const refinementFn = (value) => value[0]();
    const message = "This is a bad function array";
    const response = fnArray({
      value: incorrectFnArray,
      refinementMessageFn: () => message,
      refinementFn,
    });
    expect(response.errors[0].message).to.equal(message);
  });

  it("should contain one error with the specified message if an invalid function array is passed in with title", () => {
    const incorrectFnArray = [() => false];
    const refinementFn = (value) => value[0]();
    const title = "some-title";
    const response = fnArray({
      title,
      value: incorrectFnArray,
      refinementMessageFn: (value, title) => `${value}${title}`,
      refinementFn,
    });
    expect(response.errors[0].message).to.equal(`${incorrectFnArray}${title}`);
  });

  it("should throw an error with the thrown message if an invalid function array is passed in without a message and the refinement function throws", () => {
    const message = "This is a bad function array";
    const refinementFn = () => {
      throw message;
    };

    const response = fnArray({ value: validFunctionArray, refinementFn });

    expect(response.errors[0].message).to.equal(message);
  });
  it("should throw an error with the passed in message if an invalid function array is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad function array";
    const refinementFn = () => {
      throw "bogus";
    };

    const response = fnArray({
      value: validFunctionArray,
      refinementMessageFn: () => message,
      refinementFn,
    });

    expect(response.errors[0].message).to.equal(message);
  });
});
