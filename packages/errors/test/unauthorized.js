const { expect } = require("chai");
const { unauthorized } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Unauthorized", () => {
  it("message correct", () => {
    const message = "some-message";
    const error = unauthorized.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "Unauthorized",
      info: {},
      message,
    });
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = unauthorized.message(message, { cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "Unauthorized",
      info,
      cause,
      message,
    });
  });
});
