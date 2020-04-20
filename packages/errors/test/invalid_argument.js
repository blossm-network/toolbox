const { expect } = require("chai");
const { invalidArgument } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Bad request", () => {
  it("message correct", () => {
    const message = "some-message";
    const error = invalidArgument.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      info: {},
      message,
    });
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = invalidArgument.message(message, { cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      cause,
      info,
      message,
    });
  });
});
