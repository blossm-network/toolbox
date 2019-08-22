const { expect } = require("chai");
const { shortString } = require("..");

describe("Valid short strings", () => {
  const validShortString = "Hello";
  it("should not contain errors if the password is formatted correctly", () => {
    const response = shortString(validShortString);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid short strings", () => {
  const invalidShortString = "Vulpes bengalensis is a relatively small fox.";
  it("should contain one error if the string is too long", () => {
    const response = shortString(invalidShortString);
    expect(response.errors).to.have.lengthOf(1);
  });
});
