const { expect } = require("chai");
const { invalidArgument } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Bad request", () => {
  it("phoneNotRecognized correct", () => {
    const error = invalidArgument.phoneNotRecognized();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      info: {},
      message: "This phone number isn't recognized."
    });
  });
  it("phoneNotRecognized correct with props", () => {
    const error = invalidArgument.phoneNotRecognized({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      info,
      cause,
      message: "This phone number isn't recognized."
    });
  });
  it("codeExpired correct", () => {
    const error = invalidArgument.codeExpired();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      info: {},
      message: "This code expired."
    });
  });
  it("codeExpired correct with props", () => {
    const error = invalidArgument.codeExpired({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      info,
      cause,
      message: "This code expired."
    });
  });
  it("wrongCode correct", () => {
    const error = invalidArgument.wrongCode();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      info: {},
      message: "This code isn't right."
    });
  });
  it("wrongCode correct with props", () => {
    const error = invalidArgument.wrongCode({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      cause,
      info,
      message: "This code isn't right."
    });
  });
  it("validationFailed correct", () => {
    const error = invalidArgument.validationFailed();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      info: {},
      message: "Some information is invalid."
    });
  });
  it("wrongCode correct with props", () => {
    const error = invalidArgument.validationFailed({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      cause,
      info,
      message: "Some information is invalid."
    });
  });
  it("message correct", () => {
    const message = "some-message";
    const error = invalidArgument.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      info: {},
      message
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
      message
    });
  });
});
