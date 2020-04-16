const { expect } = require("chai");
const { objectArray } = require("..");

const validObjectArray = [{}, {}];
const invalidObjectArray = [{}, true];

describe("Valid object array", () => {
  it("should not contain errors if array has values that are objects", () => {
    const response = objectArray({ value: validObjectArray });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if array is empty", () => {
    const emptyObjectArray = [];
    const response = objectArray({ value: emptyObjectArray });
    expect(response.errors).to.be.empty;
  });
});

describe("Optional object array", () => {
  it("should not contain errors if value is not valid, regardless of optional flag", () => {
    const response = objectArray({ value: validObjectArray, optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = objectArray({ value: null, optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid object array", () => {
  it("should contain one error if array has values that are not objects", () => {
    const response = objectArray({ value: invalidObjectArray });
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if array has values that are not objects with message", () => {
    const message = "This is a bad object";
    const response = objectArray({
      value: invalidObjectArray,
      baseMessageFn: () => message,
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(message);
  });
  it("should contain one error if array has values that are not objects with message, title, and path", () => {
    const title = "some-title";
    const path = "some-path";
    const response = objectArray({
      title,
      path,
      value: invalidObjectArray,
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
    const message = "This is a bad object";
    const response = objectArray({
      value: 3,
      baseMessageFn: () => message,
    });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.equal(message);
  });
  it("should contain one error if array has values that are not objects with title response", () => {
    const title = "some-title";
    let response = objectArray({ value: invalidObjectArray, title });
    expect(response.errors).to.have.lengthOf(1);
    expect(response.errors[0].message).to.include(title);
  });
});

describe("Invalid optional object array", () => {
  it("should contain one error if array has values that are not objects, regardless of optional flag", () => {
    const response = objectArray({
      value: invalidObjectArray,
      optional: true,
    });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid object array is passed in", () => {
    const incorrectObjectArray = [{}];
    const refinementFn = (value) => value[0].key == "value";
    const message = "This is a bad object";
    const response = objectArray({
      value: incorrectObjectArray,
      refinementMessageFn: () => message,
      refinementFn,
    });
    expect(response.errors[0].message).to.equal(message);
  });
  it("should contain one error with the specified message if an invalid object array is passed in with title", () => {
    const incorrectObjectArray = [{}];
    const refinementFn = (value) => value[0].key == "value";
    const title = "some-title";
    const response = objectArray({
      title,
      value: incorrectObjectArray,
      refinementMessageFn: (value, title) => `${value}${title}`,
      refinementFn,
    });
    expect(response.errors[0].message).to.equal(
      `${incorrectObjectArray}${title}`
    );
  });

  it("should throw an error with the thrown message if an invalid object array is passed in and the refinement function throws", () => {
    const message = "This is a bad object array";
    const refinementFn = () => {
      throw message;
    };

    const response = objectArray({ value: validObjectArray, refinementFn });

    expect(response.errors[0].message).to.equal(message);
  });

  it("should throw an error with the passed in message if an invalid object array is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad object array";
    const refinementFn = () => {
      throw "bogus";
    };

    const response = objectArray({
      value: validObjectArray,
      refinementMessageFn: () => message,
      refinementFn,
    });

    expect(response.errors[0].message).to.equal(message);
  });
});
