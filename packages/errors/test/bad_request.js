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
  it("missingRoot correct", () => {
    const error = badRequest.missingRoot();
    expect(error.message).to.equal("Missing root url parameter.");
    expect(error.statusCode).to.equal(400);
  });
  it("missingRoot correct with props", () => {
    const error = badRequest.missingRoot({ cause, info });
    expect(error.message).to.equal("Missing root url parameter.");
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
  it("eventHandlerNotSpecified correct", () => {
    const error = badRequest.eventHandlerNotSpecified();
    expect(error.message).to.equal("Event handler not specified.");
    expect(error.statusCode).to.equal(400);
  });
  it("eventHandlerNotSpecified correct with props", () => {
    const error = badRequest.eventHandlerNotSpecified({ cause, info });
    expect(error.message).to.equal("Event handler not specified.");
    expect(error.toJSON().info).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(400);
  });
  it("incompleteQuery correct", () => {
    const error = badRequest.incompleteQuery();
    expect(error.message).to.equal("The query is missing a key or value.");
    expect(error.statusCode).to.equal(400);
  });
  it("incompleteQuery correct with props", () => {
    const error = badRequest.incompleteQuery({ cause, info });
    expect(error.message).to.equal("The query is missing a key or value.");
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
      cause,
    });
  });
  it("sessionTerminated correct", () => {
    const error = badRequest.sessionTerminated();
    expect(error.message).to.equal("This session is terminated.");
    expect(error.statusCode).to.equal(400);
  });
  it("sessionTerminated correct with props", () => {
    const error = badRequest.sessionTerminated({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      info,
      statusCode: 400,
      code: "BadRequest",
      message: "This session is terminated.",
      cause,
    });
  });
  it("sessionAlreadyTerminated correct", () => {
    const error = badRequest.sessionAlreadyTerminated();
    expect(error.message).to.equal("This session has already been terminated.");
    expect(error.statusCode).to.equal(400);
  });
  it("sessionAlreadyTerminated correct with props", () => {
    const error = badRequest.sessionAlreadyTerminated({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      info,
      statusCode: 400,
      code: "BadRequest",
      message: "This session has already been terminated.",
      cause,
    });
  });
  it("sessionAlreadyUpgraded correct", () => {
    const error = badRequest.sessionAlreadyUpgraded();
    expect(error.message).to.equal("This session has already been upgraded.");
    expect(error.statusCode).to.equal(400);
  });
  it("sessionAlreadyUpgraded correct with props", () => {
    const error = badRequest.sessionAlreadyUpgraded({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      info,
      statusCode: 400,
      code: "BadRequest",
      message: "This session has already been upgraded.",
      cause,
    });
  });
  it("badEvent correct", () => {
    const error = badRequest.badEvent();
    expect(error.statusCode).to.equal(400);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 400,
      info: {},
      code: "BadRequest",
      message: "Invalid event format.",
    });
  });
  it("badEvent correct with props", () => {
    const error = badRequest.badEvent({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      info,
      statusCode: 400,
      code: "BadRequest",
      message: "Invalid event format.",
      cause,
    });
  });
  it("wrongEventStore correct", () => {
    const error = badRequest.wrongEventStore();
    expect(error.statusCode).to.equal(400);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 400,
      info: {},
      code: "BadRequest",
      message: "This event store can't accept this event.",
    });
  });
  it("wrongEventStore correct with props", () => {
    const error = badRequest.wrongEventStore({ cause, info });
    expect(error.toJSON()).to.deep.equal({
      info,
      statusCode: 400,
      code: "BadRequest",
      message: "This event store can't accept this event.",
      cause,
    });
  });
  it("message correct", () => {
    const message = "some-message";
    const error = badRequest.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 400,
      info: {},
      code: "BadRequest",
      message,
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
      message,
    });
  });
});
