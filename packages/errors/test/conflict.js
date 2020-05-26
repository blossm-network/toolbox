const { expect } = require("chai");
const { conflict } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Conflict", () => {
  it("message correct", () => {
    const message = "some-message";
    const error = conflict.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "Conflict",
      info: {},
      message,
    });
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = conflict.message(message, { cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "Conflict",
      cause,
      info,
      message,
    });
  });
});
