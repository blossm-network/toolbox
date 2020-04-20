const { expect } = require("chai");
const { badRequest } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Bad request", () => {
  it("missingRoot correct", () => {
    const error = badRequest.missingRoot();
    expect(error.message).to.equal("Missing root url parameter.");
    expect(error.statusCode).to.equal(400);
  });
  it("missingRoot correct with props", () => {
    const error = badRequest.missingRoot({ cause, info });
    expect(error.message).to.equal("Missing root url parameter.");
    expect(error.toJSON().info).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(400);
  });
  it("message correct", () => {
    const message = "some-message";
    const error = badRequest.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 400,
      info: {},
      code: "BadRequest",
      message,
    });
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = badRequest.message(message, { cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 400,
      cause,
      info,
      code: "BadRequest",
      message,
    });
  });
});
