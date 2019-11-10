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
  it("message correct", () => {
    const message = "some-message";
    const error = badRequest.message(message);
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(400);
  });
});
