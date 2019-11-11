const { expect } = require("chai");
const { badRequest } = require("..");

describe("Bad request", () => {
  it("missingId correct", () => {
    const error = badRequest.missingId();
    expect(error.message).to.equal("Missing id url parameter.");
    expect(error.statusCode).to.equal(400);
  });
  it("missingMessage correct", () => {
    const error = badRequest.missingMessage();
    expect(error.message).to.equal("No Pub/Sub message received.");
    expect(error.statusCode).to.equal(400);
  });
  it("badMessage correct", () => {
    const error = badRequest.badMessage();
    expect(error.message).to.equal("Invalid Pub/Sub message format.");
    expect(error.statusCode).to.equal(400);
  });
  it("badEvent correct", () => {
    const error = badRequest.badEvent();
    expect(error.message).to.equal("Invalid event format.");
    expect(error.statusCode).to.equal(400);
  });
  it("phoneNotRecognized correct", () => {
    const error = badRequest.phoneNotRecognized();
    expect(error.message).to.equal("This phone number isn't recognized.");
    expect(error.statusCode).to.equal(400);
  });
  it("codeNotRecognized correct", () => {
    const error = badRequest.codeNotRecognized();
    expect(error.message).to.equal("This code isn't recognized.");
    expect(error.statusCode).to.equal(400);
  });
  it("codeExpired correct", () => {
    const error = badRequest.codeExpired();
    expect(error.message).to.equal("This code expired.");
    expect(error.statusCode).to.equal(400);
  });
  it("wrongCode correct", () => {
    const error = badRequest.wrongCode();
    expect(error.message).to.equal("This code isn't right.");
    expect(error.statusCode).to.equal(400);
  });
  it("message correct", () => {
    const message = "some-message";
    const error = badRequest.message(message);
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(400);
  });
});
