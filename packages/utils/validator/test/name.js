const { expect } = require("chai");
const { name } = require("../index");

describe("Valid name", () => {
  it("should not contain errors if the name is formatted correctly", () => {
    const validName = {
      first: "Joao",
      last: "Ritter"
    };
    const error = name(validName);
    expect(error).to.be.undefined;
  });
});

describe("Invalid name", () => {
  it("should contain one error if a name is missing", () => {
    const invalidName = {
      first: 2,
      last: "asdf"
    };
    const response = name(invalidName);
    expect(response.message).to.exist;
  });
});
