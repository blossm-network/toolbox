const { expect } = require("chai");
const { resourceNotFound } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Bad request", () => {
  it("root correct", () => {
    const error = resourceNotFound.root();
    expect(error.message).to.equal("Root not found.");
    expect(error.statusCode).to.equal(404);
  });
  it("root correct with props", () => {
    const error = resourceNotFound.root({ cause, info });
    expect(error.message).to.equal("Root not found.");
    expect(error.info()).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(404);
  });
  it("view id correct", () => {
    const error = resourceNotFound.viewId();
    expect(error.message).to.equal("View ID not found.");
    expect(error.statusCode).to.equal(404);
  });
  it("id correct with props", () => {
    const error = resourceNotFound.viewId({ cause, info });
    expect(error.message).to.equal("View ID not found.");
    expect(error.info()).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(404);
  });
  it("message correct", () => {
    const message = "some-message";
    const error = resourceNotFound.message(message);
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(404);
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = resourceNotFound.message(message, { cause, info });
    expect(error.message).to.equal(message);
    expect(error.info()).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(404);
  });
});
