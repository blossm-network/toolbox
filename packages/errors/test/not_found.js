const { expect } = require("chai");
const { notFound } = require("..");

describe("Not found", () => {
  it("root correct", () => {
    const error = notFound.root();
    expect(error.message).to.equal("Root not found.");
    expect(error.statusCode).to.equal(404);
  });
  it("id correct", () => {
    const error = notFound.id();
    expect(error.message).to.equal("Id not found.");
    expect(error.statusCode).to.equal(404);
  });
  it("message correct", () => {
    const message = "some-message";
    const error = notFound.message(message);
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(404);
  });
});
