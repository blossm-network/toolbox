const { expect } = require("chai");
const { badRequest } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Bad request", () => {
  it("missingId correct", () => {
    const error = badRequest.missingId();
    expect(error.message).to.equal("Missing id url parameter.");
    expect(error.statusCode).to.equal(400);
  });
  it("missingId correct with props", () => {
    const error = badRequest.missingId({ cause, info });
    expect(error.message).to.equal("Missing id url parameter.");
    expect(error.toJSON().info).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(400);
  });
  it("missingMessage correct", () => {
    const error = badRequest.missingMessage();
    expect(error.message).to.equal("No Pub/Sub message received.");
    expect(error.statusCode).to.equal(400);
  });
  it("missingMessage correct with props", () => {
    const error = badRequest.missingMessage({ cause, info });
    expect(error.message).to.equal("No Pub/Sub message received.");
    expect(error.toJSON().info).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(400);
  });
  it("badMessage correct", () => {
    const error = badRequest.badMessage();
    expect(error.message).to.equal("Invalid Pub/Sub message format.");
    expect(error.statusCode).to.equal(400);
  });
  it("badMessage correct with props", () => {
    const error = badRequest.badMessage({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      info,
      statusCode: 400,
      code: "BadRequest",
      message: "Invalid Pub/Sub message format.",
      cause
    });
  });
  it("badRoot correct", () => {
    const error = badRequest.badRoot();
    expect(error.message).to.equal("Invalid root.");
    expect(error.statusCode).to.equal(400);
  });
  it("badRoot correct with props", () => {
    const error = badRequest.badRoot({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      info,
      statusCode: 400,
      code: "BadRequest",
      message: "Invalid root.",
      cause
    });
  });
  it("badEvent correct", () => {
    const error = badRequest.badEvent();
    expect(error.statusCode).to.equal(400);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 400,
      info: {},
      code: "BadRequest",
      message: "Invalid event format."
    });
  });
  it("badEvent correct with props", () => {
    const error = badRequest.badEvent({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      info,
      statusCode: 400,
      code: "BadRequest",
      message: "Invalid event format.",
      cause
    });
  });
  it("message correct", () => {
    const message = "some-message";
    const error = badRequest.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 400,
      info: {},
      code: "BadRequest",
      message
    });
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = badRequest.message(message, { cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 400,
      cause,
      info,
      code: "BadRequest",
      message
    });
  });
});
