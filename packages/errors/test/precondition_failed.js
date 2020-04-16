const { expect } = require("chai");
const { preconditionFailed } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Precondition failed", () => {
  it("eventNumberIncorrect correct", () => {
    const error = preconditionFailed.eventNumberIncorrect();
    expect(error.message).to.equal("Event number incorrect.");
    expect(error.statusCode).to.equal(412);
  });
  it("eventNumberIncorrect correct with props", () => {
    const error = preconditionFailed.eventNumberIncorrect({ cause, info });
    expect(error.message).to.equal("Event number incorrect.");
    expect(error.toJSON().info).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(412);
  });
  it("eventNumberDuplicate correct", () => {
    const error = preconditionFailed.eventNumberDuplicate();
    expect(error.message).to.equal("Event number duplicate.");
    expect(error.statusCode).to.equal(412);
  });
  it("eventNumberDuplicate correct with props", () => {
    const error = preconditionFailed.eventNumberDuplicate({ cause, info });
    expect(error.message).to.equal("Event number duplicate.");
    expect(error.toJSON().info).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(412);
  });
  it("message correct", () => {
    const message = "some-message";
    const error = preconditionFailed.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 412,
      info: {},
      code: "PreconditionFailed",
      message,
    });
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = preconditionFailed.message(message, { cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 412,
      cause,
      info,
      code: "PreconditionFailed",
      message,
    });
  });
});
