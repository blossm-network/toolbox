const { expect } = require("chai");
const { date } = require("..");

describe("Valid date", () => {
  it("should not contain errors if the date is formatted correctly", () => {
    const response = date("March 21, 2000");
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if the date is formatted correctly as an iso string", () => {
    const response = date("1996-10-15T00:05:32.000Z");
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid email", () => {
  it("should contain one error if the date isn't formatted correctly", () => {
    const response = date("March");
    expect(response.errors).to.have.lengthOf(1);
  });
});
