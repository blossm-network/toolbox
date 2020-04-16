const { expect } = require("chai");
const { resourceNotFound } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Bad request", () => {
  it("root correct", () => {
    const error = resourceNotFound.root();
    expect(error.toJSON()).to.deep.equal({
      statusCode: 404,
      code: "ResourceNotFound",
      info: {},
      message: "This root wasn't found.",
    });
  });
  it("root correct with props", () => {
    const error = resourceNotFound.root({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 404,
      code: "ResourceNotFound",
      info,
      cause,
      message: "This root wasn't found.",
    });
  });
  it("view id correct", () => {
    const error = resourceNotFound.view();
    expect(error.message).to.equal("This view wasn't found.");
    expect(error.statusCode).to.equal(404);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 404,
      code: "ResourceNotFound",
      info: {},
      message: "This view wasn't found.",
    });
  });
  it("id correct with props", () => {
    const error = resourceNotFound.view({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 404,
      code: "ResourceNotFound",
      info,
      cause,
      message: "This view wasn't found.",
    });
  });
  it("message correct", () => {
    const message = "some-message";
    const error = resourceNotFound.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 404,
      code: "ResourceNotFound",
      info: {},
      message,
    });
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = resourceNotFound.message(message, { cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 404,
      code: "ResourceNotFound",
      info,
      cause,
      message,
    });
  });
});
