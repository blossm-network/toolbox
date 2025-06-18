import * as chai from "chai";
import { phoneNumber } from "../index.js";

const { expect } = chai;

describe("Valid email", () => {
  it("should not contain errors if the email is formatted correctly", () => {
    const validPhoneNumber = "9193571144";
    const response = phoneNumber(validPhoneNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid phone number", () => {
  it("should contain one error if the phone number isn't formatted correctly", () => {
    const invalidPhoneNumber = "193571144";
    const response = phoneNumber(invalidPhoneNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
