const { expect } = require("chai");
const { invalidCredentials } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Invalid credentials", () => {
  it("tokenExpired correct", () => {
    const error = invalidCredentials.tokenExpired();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info: { reason: "expired" },
      message: "This token is expired.",
    });
  });
  it("tokenExpired correct with props", () => {
    const error = invalidCredentials.tokenExpired({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info: { ...info, reason: "expired" },
      cause,
      message: "This token is expired.",
    });
  });
  it("wrongAudience correct", () => {
    const error = invalidCredentials.wrongAudience();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info: {},
      message: "This token isn't meant for this audience.",
    });
  });
  it("wrongAudience correct with props", () => {
    const error = invalidCredentials.wrongAudience({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info,
      cause,
      message: "This token isn't meant for this audience.",
    });
  });
  it("tokenNotActive correct", () => {
    const error = invalidCredentials.tokenNotActive();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info: {},
      message: "This token is not active.",
    });
  });
  it("tokenNotActive correct with props", () => {
    const error = invalidCredentials.tokenNotActive({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info,
      cause,
      message: "This token is not active.",
    });
  });
  it("tokenTerminated correct", () => {
    const error = invalidCredentials.tokenTerminated();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info: {},
      message: "This token has already been terminated.",
    });
  });
  it("tokenTerminated correct with props", () => {
    const error = invalidCredentials.tokenTerminated({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info,
      cause,
      message: "This token has already been terminated.",
    });
  });
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
