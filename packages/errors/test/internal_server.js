const { expect } = require("chai");
const { internalServer } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Internal server", () => {
  it("message correct", () => {
    const message = "some-message";
    const error = internalServer.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 500,
      code: "InternalServer",
      info: {},
      message,
    });
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = internalServer.message(message, { cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 500,
      code: "InternalServer",
      info,
      cause,
      message,
    });
  });
});
