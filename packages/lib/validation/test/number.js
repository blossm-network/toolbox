const { expect } = require("chai");
const { number } = require("../index");

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
    const fn = value => value != 0;
    const response = number({ value: validNumber, fn });
    expect(response.errors).to.have.lengthOf(1);
  });
});

describe("Error message", () => {
  it("should contain one error with the specified message if an invalid number is passed in", () => {
    const incorrectNumber = 0;
    const fn = value => value != 0;
    const message = "This is a bad number";
    const response = number({
      value: incorrectNumber,
      message: () => message,
      fn
    });
    expect(response.errors[0].message).to.equal(message);
  });

  it("should throw an error with the thrown message if an invalid number is passed in and the refinement function throws", () => {
    const message = "This is a bad number";
    const fn = () => {
      throw message;
    };

    const response = number({ value: validNumber, fn });

    expect(response.errors[0].message).to.equal(message);
  });

  it("should throw an error with the passed in message if an invalid number is passed in with a message and the refinement function throws", () => {
    const message = "This is a bad number";
    const fn = () => {
      throw "bogus";
    };

    const response = number({ value: validNumber, message: () => message, fn });

    expect(response.errors[0].message).to.equal(message);
  });
});
