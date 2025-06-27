import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

describe("Valid email", () => {
  it("should not contain errors if the email is formatted correctly", () => {
    const validEmail = "user@domain.io";
    const response = validator.email(validEmail);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid email", () => {
  it("should contain one error if the email isn't formatted correctly", () => {
    const invalidEmail = "user@domain";
    const response = validator.email(invalidEmail);
    expect(response.errors).to.have.lengthOf(1);
  });
});
