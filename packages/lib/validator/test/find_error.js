const { expect } = require("chai");
const { findError, string } = require("..");

describe("Errors exist", () => {
  it("should return the first error that is found", () => {
    const error = findError([string(123), string(2)]);
    expect(error.message).to.contain("123");
  });
  it("should return an error if present", () => {
    const errorMessage = "Im an error";
    const err = Error(errorMessage);
    const error = findError([err, string(""), string("")]);
    expect(error.message).to.equal(errorMessage);
  });
  it("should return an error if a message present", () => {
    const errorMessage = "Im an error";
    const error = findError([errorMessage, string(""), string("")]);
    expect(error.message).to.equal(errorMessage);
  });
});

describe("No errors", () => {
  it("should return null if no errors exits", () => {
    const error = findError([string(""), string("")]);
    expect(error).to.be.null;
  });
});
