const { expect } = require("chai");
const { forbidden } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Forbidden", () => {
  it("wrongContext correct", () => {
    const error = forbidden.wrongContext();
    expect(error.message).to.equal("Missing required permissions.");
    expect(error.statusCode).to.equal(403);
  });
  it("missingRoot correct with props", () => {
    const error = forbidden.wrongContext({ cause, info });
    expect(error.message).to.equal("Missing required permissions.");
    expect(error.toJSON().info).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(403);
  });
  it("message correct", () => {
    const message = "some-message";
    const error = forbidden.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 403,
      code: "Forbidden",
      info: {},
      message
    });
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = forbidden.message(message, { cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 403,
      code: "Forbidden",
      info,
      cause,
      message
    });
  });
});
