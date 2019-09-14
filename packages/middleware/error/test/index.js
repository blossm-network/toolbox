const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");
const errorMiddleware = require("..");

describe("Error middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const req = {};

    const statusCode = "some-status-code";
    const err = {
      statusCode
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };
    await errorMiddleware(err, req, res);
    expect(statusFake).to.have.been.calledWith(statusCode);
    expect(sendFake).to.have.been.calledWith(err);
  });
  it("should call correctly with no status code", async () => {
    const req = {};

    const err = {};
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };
    await errorMiddleware(err, req, res);
    expect(statusFake).to.have.been.calledWith(500);
    expect(sendFake).to.have.been.calledWith(err);
  });
  it("should remove the token correctly if unauthorized", async () => {
    const req = {};

    const statusCode = 401;
    const err = {
      statusCode
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const clearCookieFake = fake();
    const res = {
      status: statusFake,
      clearCookie: clearCookieFake
    };
    await errorMiddleware(err, req, res);
    expect(statusFake).to.have.been.calledWith(statusCode);
    expect(sendFake).to.have.been.calledWith(err);
    expect(clearCookieFake).to.have.been.calledWith("token");
  });
  it("should call correctly with headers already sent", async () => {
    const req = {};

    const err = {};
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake,
      headersSent: "some"
    };
    expect(async () => await errorMiddleware(err, req, res)).to.throw;
  });
});
