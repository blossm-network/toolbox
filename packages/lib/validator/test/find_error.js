import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

describe("Errors exist", () => {
  it("should return the first error that is found", () => {
    const error = validator.findError([validator.string(123), validator.string(2)]);
    expect(error.info().errors).to.be.of.length(2);
    expect(error.message).to.equal("Some information is invalid.");
  });
  it("should return nested errors that is found", () => {
    const message = "some-message";
    const path = "some-path";
    const toJSON = () => {
      return { info: { errors: [{ message, path }] } };
    };
    const error = validator.findError([{ toJSON }]);
    expect(error.info().errors).to.be.of.length(1);
    expect(error.message).to.equal("Some information is invalid.");
  });
});

describe("No errors", () => {
  it("should return null if no errors exits", () => {
    const error = validator.findError([validator.string(""), validator.string("")]);
    expect(error).to.be.null;
  });
});
