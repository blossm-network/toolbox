const { expect } = require("chai");
const { object } = require("..");

const invalidObjects = ["hello", 0, () => 0, false];
const validObject = { key: "value" };

describe("Valid objects", () => {
  it("should not contain errors if value is not empty", () => {
    const response = object({ value: validObject });
    expect(response.errors).to.be.empty;
  });
});

describe("Optional objects", () => {
  it("should not contain errors if value is not empty", () => {
    const response = object({ value: validObject, optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = object({ value: null, optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Refinement functions", () => {
  it("should not contain errors if value is not empty and passes refinement function", () => {
    const fn = value => value.key == "value";
    const response = object({ value: validObject, fn });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid object", () => {
  it("should contain one error if something other than a object is passed in", () => {
    invalidObjects.forEach(invalidObject => {
      let response = object({ value: invalidObject });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});

describe("Invalid optional object", () => {
  it("should contain one error if something other than a object is passed in, regardless of optional flag", () => {
    invalidObjects.forEach(invalidObject => {
      let response = object({ value: invalidObject, optional: true });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});

describe("Valid object that doesn't satisfy refinement", () => {
  it("should contain one error if a object is passed in that doesn't satisfy the refinement function", () => {
    const incorrectObject = {};
    const fn = value => value.key == "value";
    const response = object({ value: incorrectObject, fn });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid object is passed in", () => {
    const incorrectObject = {};
    const fn = value => value.key == "value";
    const message = "This is a bad object";
    const response = object({
      value: incorrectObject,
      message: () => message,
      fn
    });
    expect(response.errors[0].message).to.equal(message);
  });

  it("should throw an error with the thrown message if an invalid object is passed in and the refinement function throws", () => {
    const message = "This is a bad object";
    const fn = () => {
      throw message;
    };

    const response = object({ value: validObject, fn });

    expect(response.errors[0].message).to.equal(message);
  });

  it("should throw an error with the passed in message if an invalid object is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad object";
    const fn = () => {
      throw "bogus";
    };

    const response = object({ value: validObject, message: () => message, fn });

    expect(response.errors[0].message).to.equal(message);
  });
});
