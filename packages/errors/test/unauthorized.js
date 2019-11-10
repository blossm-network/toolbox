const { expect } = require("chai");
const { unauthorized } = require("..");

describe("Unauthorized", () => {
  it("tokenInvalid correct", () => {
    const error = unauthorized.tokenInvalid();
    expect(error.message).to.equal("Invalid token.");
    expect(error.statusCode).to.equal(401);
  });
  it("tokenExpired correct", () => {
    const error = unauthorized.tokenExpired();
    expect(error.message).to.equal("Token expired.");
    expect(error.statusCode).to.equal(401);
  });
  it("cors correct", () => {
    const error = unauthorized.cors();
    expect(error.message).to.equal("Not allowed by CORS.");
    expect(error.statusCode).to.equal(401);
  });
  it("message correct", () => {
    const message = "some-message";
    const error = unauthorized.message(message);
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(401);
  });
});
