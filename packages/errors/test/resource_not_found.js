const { expect } = require("chai");
const { resourceNotFound } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Bad request", () => {
  it("message correct", () => {
    const message = "some-message";
    const error = resourceNotFound.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 404,
      code: "ResourceNotFound",
      info: {},
      message,
    });
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = resourceNotFound.message(message, { cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 404,
      code: "ResourceNotFound",
      info,
      cause,
      message,
    });
  });
});
