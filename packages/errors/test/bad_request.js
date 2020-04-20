const { expect } = require("chai");
const { badRequest } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Bad request", () => {
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
