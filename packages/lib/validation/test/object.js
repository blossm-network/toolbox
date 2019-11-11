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
  it("should contain one error if something other than a object is passed in with message", () => {
    const message = "This is a bad object";
    invalidObjects.forEach(invalidObject => {
      let response = object({
        value: invalidObject,
        baseMessageFn: () => message
      });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.equal(message);
    });
  });
  it("should contain one error if something other than a object is passed in with message and title", () => {
    const title = "some-title";
    invalidObjects.forEach(invalidObject => {
      let response = object({
        title,
        value: invalidObject,
        baseMessageFn: (e, title) => {
          expect(e).to.exist;
          return title;
        }
      });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.equal(title);
    });
  });
  it("should contain one error if something other than a object is passed in with title response", () => {
    const title = "some-title";
    invalidObjects.forEach(invalidObject => {
      let response = object({ value: invalidObject, title });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.include(title);
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
    const refinementFn = value => value.key == "value";
    const response = object({ value: incorrectObject, refinementFn });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid object is passed in", () => {
    const incorrectObject = {};
    const refinementFn = value => value.key == "value";
    const message = "This is a bad object";
    const response = object({
      value: incorrectObject,
      refinementMessageFn: () => message,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(message);
  });
  it("should contain one error with the specified message if an invalid object is passed in with title", () => {
    const incorrectObject = {};
    const refinementFn = value => value.key == "value";
    const title = "some-title";
    const response = object({
      title,
      value: incorrectObject,
      refinementMessageFn: (value, title) => `${value}${title}`,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(`${incorrectObject}${title}`);
  });

  it("should throw an error with the thrown message if an invalid object is passed in and the refinement function throws", () => {
    const message = "This is a bad object";
    const refinementFn = () => {
      throw message;
    };

    const response = object({ value: validObject, refinementFn });

    expect(response.errors[0].message).to.equal(message);
  });

  it("should throw an error with the passed in message if an invalid object is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad object";
    const refinementFn = () => {
      throw "bogus";
    };

    const response = object({
      value: validObject,
      refinementMessageFn: () => message,
      refinementFn
    });

    expect(response.errors[0].message).to.equal(message);
  });
});
