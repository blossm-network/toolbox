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
    const code = "some-code";
    const message = "some-message";
    const info = "some-info";

    const err = {
      statusCode,
      code,
      message,
      info,
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const nextFake = fake();
    await errorMiddleware(err, req, res, nextFake);
    expect(statusFake).to.have.been.calledWith(statusCode);
    expect(sendFake).to.have.been.calledWith({
      statusCode,
      code,
      message,
      info,
    });
    expect(nextFake).to.have.been.calledWith();
  });
  it("should call correctly with no status code", async () => {
    const req = {};

    const err = {};
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const nextFake = fake();

    await errorMiddleware(err, req, res, nextFake);
    expect(statusFake).to.have.been.calledWith(500);
    expect(sendFake).to.have.been.calledWith(err);
    expect(nextFake).to.have.been.calledWith();
  });
  it("should remove the token correctly if unauthorized", async () => {
    const req = {};

    const statusCode = 401;
    const err = {
      statusCode,
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const clearCookieFake = fake();
    const res = {
      status: statusFake,
      clearCookie: clearCookieFake,
    };
    const nextFake = fake();
    await errorMiddleware(err, req, res, nextFake);
    expect(statusFake).to.have.been.calledWith(statusCode);
    expect(sendFake).to.have.been.calledWith(err);
    expect(clearCookieFake).to.have.been.calledWith("token");
    expect(nextFake).to.have.been.calledWith();
  });
  it("should call correctly with headers already sent", async () => {
    const req = {};

    const err = {};
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
      headersSent: "some",
    };
    const nextFake = fake();
    await errorMiddleware(err, req, res, nextFake);
    expect(nextFake).to.have.been.calledWith(err);
  });
});
