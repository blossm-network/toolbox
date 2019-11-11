const { expect } = require("chai");
const { unauthorized } = require("..");

const cause = new Error();
const info = { some: "info" };

describe("Unauthorized", () => {
  it("cors correct", () => {
    const error = unauthorized.cors();
    expect(error.message).to.equal("Not allowed by CORS.");
    expect(error.statusCode).to.equal(401);
  });
  it("cors correct with props", () => {
    const error = unauthorized.cors({ cause, info });
    expect(error.message).to.equal("Not allowed by CORS.");
    expect(error.info()).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(401);
  });
  it("message correct", () => {
    const message = "some-message";
    const error = unauthorized.message(message);
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(401);
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = unauthorized.message(message, { cause, info });
    expect(error.message).to.equal(message);
    expect(error.info()).to.deep.equal(info);
    expect(error.cause()).to.deep.equal(cause);
    expect(error.statusCode).to.equal(401);
  });
});
