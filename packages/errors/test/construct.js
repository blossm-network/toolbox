const { expect } = require("chai");
const { construct } = require("..");

const message = "some-message";
describe("Construct", () => {
  it("400 correct", () => {
    const error = construct({ statusCode: 400, message });
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(400);
  });
  it("401 correct", () => {
    const error = construct({ statusCode: 401, message });
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(401);
  });
  it("404 correct", () => {
    const error = construct({ statusCode: 404, message });
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(404);
  });
  it("409 correct", () => {
    const error = construct({ statusCode: 409, message });
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(409);
  });
  it("500 correct", () => {
    const error = construct({ statusCode: 500, message });
    expect(error.message).to.equal(message);
    expect(error.statusCode).to.equal(500);
  });
});
