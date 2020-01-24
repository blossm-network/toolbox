const { expect } = require("chai");
const { invalidCredentials } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Invalid credentials", () => {
  it("tokenInvalid correct", () => {
    const error = invalidCredentials.tokenInvalid();
    expect(error.message).to.equal("This token is invalid.");
    expect(error.statusCode).to.equal(401);
  });
  it("tokenInvalid correct with props", () => {
    const error = invalidCredentials.tokenInvalid({ cause, info });
    expect(error.message).to.equal("This token is invalid.");
    expect(error.info()).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(401);
  });
  it("tokenExpired correct", () => {
    const error = invalidCredentials.tokenExpired();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info: {},
      message: "This token is expired."
    });
  });
  it("tokenExpired correct with props", () => {
    const error = invalidCredentials.tokenExpired({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info,
      cause,
      message: "This token is expired."
    });
  });
  it("tokenTerminated correct", () => {
    const error = invalidCredentials.tokenTerminated();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info: {},
      message: "This token has already been terminated."
    });
  });
  it("tokenTerminated correct with props", () => {
    const error = invalidCredentials.tokenTerminated({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info,
      cause,
      message: "This token has already been terminated."
    });
  });
  it("phoneNotRecognized correct", () => {
    const error = invalidCredentials.phoneNotRecognized();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info: {},
      message: "This phone number isn't recognized."
    });
  });
  it("phoneNotRecognized correct with props", () => {
    const error = invalidCredentials.phoneNotRecognized({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info,
      cause,
      message: "This phone number isn't recognized."
    });
  });
  it("message correct", () => {
    const message = "some-message";
    const error = invalidCredentials.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "InvalidCredentials",
      info: {},
      message
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
      message
    });
  });
});
