const { expect } = require("chai");
const { findError, string } = require("..");

describe("Errors exist", () => {
  it("should return the first error that is found", () => {
    const error = findError([string(123), string(2)]);
    expect(error.info().errors).to.be.of.length(2);
    expect(error.message).to.equal("Some information is invalid.");
  });
  it("should return nested errors that is found", () => {
    const message = "some-message";
    const path = "some-path";
    const toJSON = () => {
      return { errors: [{ message, path }] };
    };
    const error = findError([{ toJSON }]);
    expect(error.info().errors).to.be.of.length(1);
    expect(error.message).to.equal("Some information is invalid.");
  });
});

describe("No errors", () => {
  it("should return null if no errors exits", () => {
    const error = findError([string(""), string("")]);
    expect(error).to.be.null;
  });
});
