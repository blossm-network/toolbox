import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

describe("Valid name", () => {
  it("should not contain errors if the name is formatted correctly", () => {
    const validName = {
      first: "Joao",
      last: "Ritter",
    };
    const error = validator.name(validName);
    expect(error).to.be.undefined;
  });
});

describe("Invalid name", () => {
  it("should contain one error if a name is missing", () => {
    const invalidName = {
      first: 2,
      last: "asdf",
    };
    const response = validator.name(invalidName, { title: "sug" });
    expect(response.message).to.exist;
  });
});
