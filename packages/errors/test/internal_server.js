const { expect } = require("chai");
const { internalServer } = require("..");

describe("Internal server", () => {
  it("message correct", () => {
    const message = "some-message";
    const error = internalServer.message(message);
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(500);
  });
});
