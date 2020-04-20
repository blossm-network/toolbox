const { expect } = require("chai");
const { invalidCredentials } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Invalid credentials", () => {
  it("message correct", () => {
    const message = "some-message";
    const error = invalidCredentials.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info: {},
      message,
    });
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = invalidCredentials.message(message, { cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info,
      cause,
      message,
    });
  });
});
