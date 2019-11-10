const { expect } = require("chai");
const { conflict } = require("..");

describe("Conflict", () => {
  it("phoneNotRecognized correct", () => {
    const error = conflict.phoneNotRecognized();
    expect(error.message).to.equal("This phone number isn't recognized.");
    expect(error.statusCode).to.equal(409);
  });
  it("codeNotRecognized correct", () => {
    const error = conflict.codeNotRecognized();
    expect(error.message).to.equal("This code isn't recognized.");
    expect(error.statusCode).to.equal(409);
  });
  it("codeExpired correct", () => {
    const error = conflict.codeExpired();
    expect(error.message).to.equal("This code expired.");
    expect(error.statusCode).to.equal(409);
  });
  it("wrongCode correct", () => {
    const error = conflict.wrongCode();
    expect(error.message).to.equal("This code isn't right.");
    expect(error.statusCode).to.equal(409);
  });
  it("message correct", () => {
    const message = "some-message";
    const error = conflict.message(message);
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(409);
  });
});
