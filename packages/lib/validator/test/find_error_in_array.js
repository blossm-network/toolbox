import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

describe("Errors exist", () => {
  it("should return the first error that is found", () => {
    const error = validator.findErrorInArray([123, 2], validator.string);
    expect(error.info().errors).to.be.of.length(2);
    expect(error.message).to.equal("Some information is invalid.");
  });
});

describe("No errors", () => {
  it("should return null if no errors exits", () => {
    const error = validator.findErrorInArray(["", ""], validator.string);
    expect(error).to.be.null;
  });
});
