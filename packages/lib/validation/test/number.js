const { expect } = require("chai");
const { number } = require("..");

const invalidNumbers = ["hello", true, () => 0, {}];
const validNumber = 0;

describe("Valid numbers", () => {
  it("should not contain errors if value is not empty", () => {
    const response = number({ value: validNumber });
    expect(response.errors).to.be.empty;
  });
});

describe("Optional numbers", () => {
  it("should not contain errors if value is not empty", () => {
    const response = number({ value: validNumber, optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = number({ value: null, optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Refinement functions", () => {
  it("should not contain errors if value is not empty and passes refinement function", () => {
    const fn = value => value == 0;
    const response = number({ value: validNumber, fn });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid number", () => {
  it("should contain one error if something other than a number is passed in", () => {
    invalidNumbers.forEach(invalidNumber => {
      let response = number({ value: invalidNumber });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
  it("should contain one error if something other than a number is passed in with message", () => {
    const message = "This is a bad number";
    invalidNumbers.forEach(invalidNumber => {
      let response = number({
        value: invalidNumber,
        baseMessageFn: () => message
      });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.equal(message);
    });
  });
  it("should contain one error if something other than a number is passed in with message, title, and path", () => {
    const title = "some-title";
    const path = "some-path";
    invalidNumbers.forEach(invalidNumber => {
      let response = number({
        title,
        path,
        value: invalidNumber,
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
  it("should contain one error if something other than a number is passed in with title response", () => {
    const title = "some-title";
    invalidNumbers.forEach(invalidNumber => {
      let response = number({ value: invalidNumber, title });
      expect(response.errors).to.have.lengthOf(1);
      expect(response.errors[0].message).to.include(title);
    });
  });
});

describe("Invalid optional number", () => {
  it("should contain one error if something other than a number is passed in, regardless of optional flag", () => {
    invalidNumbers.forEach(invalidNumber => {
      let response = number({ value: invalidNumber, optional: true });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});

describe("Valid number that doesn't satisfy refinement", () => {
  it("should contain one error if a number is passed in that doesn't satisfy the refinement function", () => {
    const refinementFn = value => value != 0;
    const response = number({ value: validNumber, refinementFn });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid number is passed in", () => {
    const incorrectNumber = 0;
    const refinementFn = value => value != 0;
    const message = "This is a bad number";
    const response = number({
      value: incorrectNumber,
      refinementMessageFn: () => message,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(message);
  });

  it("should contain one error with the specified message if an invalid number is passed in with title", () => {
    const incorrectNumber = 0;
    const refinementFn = value => value != 0;
    const title = "some-title";
    const response = number({
      title,
      value: incorrectNumber,
      refinementMessageFn: (value, title) => `${value}${title}`,
      refinementFn
    });
    expect(response.errors[0].message).to.equal(`${incorrectNumber}${title}`);
  });

  it("should throw an error with the thrown message if an invalid number is passed in and the refinement function throws", () => {
    const message = "This is a bad number";
    const refinementFn = () => {
      throw message;
    };

    const response = number({ value: validNumber, refinementFn });

    expect(response.errors[0].message).to.equal(message);
  });

  it("should throw an error with the passed in message if an invalid number is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad number";
    const refinementFn = () => {
      throw "bogus";
    };

    const response = number({
      value: validNumber,
      refinementMessageFn: () => message,
      refinementFn
    });

    expect(response.errors[0].message).to.equal(message);
  });
});
