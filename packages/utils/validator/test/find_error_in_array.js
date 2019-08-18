const { expect } = require("chai");
const { findErrorInArray, string } = require("../index");

describe("Errors exist", () => {
  it("should return the first error that is found", () => {
    const error = findErrorInArray([123, 2], string);
    expect(error.message).to.contain("123");
  });
});

describe("No errors", () => {
  it("should return null if no errors exits", () => {
    const error = findErrorInArray(["", ""], string);
    expect(error).to.be.null;
  });
});
