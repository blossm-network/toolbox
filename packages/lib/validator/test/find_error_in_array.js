const { expect } = require("chai");
const { findErrorInArray, string } = require("..");

describe("Errors exist", () => {
  it("should return the first error that is found", () => {
    const error = findErrorInArray([123, 2], string);
    expect(error.info().errors).to.be.of.length(2);
    expect(error.message).to.equal("Some information is invalid.");
  });
});

describe("No errors", () => {
  it("should return null if no errors exits", () => {
    const error = findErrorInArray(["", ""], string);
    expect(error).to.be.null;
  });
});
