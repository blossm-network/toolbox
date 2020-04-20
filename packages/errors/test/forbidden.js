const { expect } = require("chai");
const { forbidden } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Forbidden", () => {
  it("message correct", () => {
    const message = "some-message";
    const error = forbidden.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 403,
      code: "Forbidden",
      info: {},
      message,
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
      message,
    });
  });
});
