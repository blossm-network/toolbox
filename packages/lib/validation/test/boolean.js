const { expect } = require("chai");
const { boolean } = require("..");

const invalidBooleans = ["hello", 0, () => 0, {}];
const validBoolean = false;

describe("Valid booleans", () => {
  it("should not contain errors if value is not empty", () => {
    const response = boolean({ value: validBoolean });
    expect(response.errors).to.be.empty;
  });
});

describe("Optional booleans", () => {
  it("should not contain errors if value is not empty", () => {
    const response = boolean({ value: validBoolean, optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = boolean({ value: null, optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Refinement functions", () => {
  it("should not contain errors if value is not empty and passes refinement function", () => {
    const fn = value => value == false;
    const response = boolean({ value: validBoolean, fn });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid boolean", () => {
  it("should contain one error if something other than a boolean is passed in", () => {
    invalidBooleans.forEach(invalidBoolean => {
      let response = boolean({ value: invalidBoolean });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
  it("should contain one error if something other than a boolean is passed in with message", () => {
    const message = "This is a bad boolean";
    invalidBooleans.forEach(invalidBoolean => {
      let response = boolean({
        value: invalidBoolean,
        baseMessageFn: () => message
      });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.equal(message);
    });
  });
  it("should contain one error if something other than a boolean is passed in with message, title, and path", () => {
    const title = "some-title";
    const path = "some-path";
    invalidBooleans.forEach(invalidBoolean => {
      let response = boolean({
        title,
        path,
        value: invalidBoolean,
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
  it("should contain one error if something other than a boolean is passed in with title response", () => {
    const title = "some-title";
    invalidBooleans.forEach(invalidBoolean => {
      let response = boolean({ value: invalidBoolean, title });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.include(title);
    });
  });
});

describe("Invalid optional boolean", () => {
  it("should contain one error if something other than a boolean is passed in, regardless of optional flag", () => {
    invalidBooleans.forEach(invalidBoolean => {
      let response = boolean({ value: invalidBoolean, optional: true });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});

describe("Valid boolean that doesn't satisfy refinement", () => {
  it("should contain one error if a boolean is passed in that doesn't satisfy the refinement function", () => {
    const refinementFn = value => value != false;
    const response = boolean({ value: validBoolean, refinementFn });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid boolean is passed in", () => {
    const incorrectBoolean = false;
    const refinementFn = value => value != false;
    const message = "This is a bad boolean";
    const response = boolean({
      value: incorrectBoolean,
      refinementMessageFn: () => message,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(message);
  });

  it("should contain one error with the specified message if an invalid boolean is passed in with title", () => {
    const incorrectBoolean = false;
    const refinementFn = value => value != false;
    const title = "some-title";
    const response = boolean({
      title,
      value: incorrectBoolean,
      refinementMessageFn: (value, title) => `${value}${title}`,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(`${incorrectBoolean}${title}`);
  });

  it("should throw an error with the thrown message if an invalid boolean is passed in and the refinement function throws", () => {
    const message = "This is a bad boolean";
    const refinementFn = () => {
      throw message;
    };

    const response = boolean({
      value: validBoolean,
      refinementFn
    });

    expect(response.errors[0].message).to.equal(message);
  });

  it("should throw an error with the passed in message if an invalid boolean is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad boolean";
    const refinementFn = () => {
      throw "bogus";
    };

    const response = boolean({
      value: validBoolean,
      refinementMessageFn: () => message,
      refinementFn
    });

    expect(response.errors[0].message).to.equal(message);
  });
});
