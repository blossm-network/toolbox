const { expect } = require("chai");
const { ethAddress } = require("..");

describe("Valid Ethereum address", () => {
  it("should not contain errors if the address is formatted correctly", () => {
    const validAddress = "0x2F015C60E0be116B1f0CD534704Db9c92118FB6A";
    const response = ethAddress(validAddress);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid eth address", () => {
  it("should contain one error if the address isn't formatted correctly", () => {
    const invalidAddress = "bad";
    const response = ethAddress(invalidAddress);
    expect(response.errors).to.have.lengthOf(1);
  });
});
