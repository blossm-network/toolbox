const { expect } = require("chai");
const { password } = require("../index");

describe("Valid passwords", () => {
  it("should not contain errors if the password is formatted correctly", () => {
    const validPassword = "123!@#adsfASDF";
    const response = password(validPassword);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid passwords", () => {
  it("should contain one error if the value is less than the minimum length", () => {
    const shortPassword = "1!s";
    const response = password(shortPassword);
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if the value is greater than the maximum length", () => {
    const longPassword =
      "1!saaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const response = password(longPassword);
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if the value has no symbol", () => {
    const invalidPassword = "asdfasdf1234";
    const response = password(invalidPassword);
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if the value has no number", () => {
    const invalidPassword = "asdfasdf!@#!@#";
    const response = password(invalidPassword);
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if the value has no letter", () => {
    const invalidPassword = "123123!@#!@#";
    const response = password(invalidPassword);
    expect(response.errors).to.have.lengthOf(1);
  });
  it("should contain one error if the value has invalid symbols", () => {
    const invalidPassword = "123123!@#!@#as;";
    const response = password(invalidPassword);
    expect(response.errors).to.have.lengthOf(1);
  });
});
