const { expect } = require("chai");
const { unauthorized } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Unauthorized", () => {
  it("cors correct", () => {
    const error = unauthorized.cors();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "Unauthorized",
      info: {},
      message: "Not allowed by CORS."
    });
  });
  it("cors correct with props", () => {
    const error = unauthorized.cors({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "Unauthorized",
      info,
      cause,
      message: "Not allowed by CORS."
    });
  });
  it("context correct", () => {
    const error = unauthorized.context();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "Unauthorized",
      info: {},
      message: "This context isn't accessible."
    });
  });
  it("context correct with props", () => {
    const error = unauthorized.context({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "Unauthorized",
      info,
      cause,
      message: "This context isn't accessible."
    });
  });
  it("message correct", () => {
    const message = "some-message";
    const error = unauthorized.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "Unauthorized",
      info: {},
      message
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
      message
    });
  });
});
