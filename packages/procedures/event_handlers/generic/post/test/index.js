const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");

const post = require("..");
const deps = require("../deps");

const from = 0;
const root = "some-root";
const data = Buffer.from(JSON.stringify({ from, root }));

describe("Command handler post", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const mainFnFake = fake();
    const streamFnFake = fake();
    const nextEventNumberFnFake = fake.returns(from);
    const incrementNextEventNumberFnFake = fake();

    const req = {
      body: {
        message: { data },
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    await post({
      mainFn: mainFnFake,
      streamFn: streamFnFake,
      nextEventNumberFn: nextEventNumberFnFake,
      incrementNextEventNumberFn: incrementNextEventNumberFnFake,
    })(req, res);

    expect(nextEventNumberFnFake).to.have.been.calledWith({ root });
    expect(streamFnFake).to.have.been.calledWith({ root, from });

    const number = "some-number";
    const event = {
      headers: {
        number,
      },
    };

    await streamFnFake.lastCall.lastArg(event);

    expect(mainFnFake).to.have.been.calledWith(event);
    expect(incrementNextEventNumberFnFake).to.have.been.calledWith({
      root,
      from: number,
    });

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params if numbers are wrong, but forced", async () => {
    const mainFnFake = fake();
    const streamFnFake = fake();
    const incrementNextEventNumberFnFake = fake();
    const nextEventNumberFnFake = fake.returns(from + 1);

    const data = Buffer.from(JSON.stringify({ from, root, force: true }));
    const req = {
      body: {
        message: { data },
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    await post({
      mainFn: mainFnFake,
      streamFn: streamFnFake,
      nextEventNumberFn: nextEventNumberFnFake,
      incrementNextEventNumberFn: incrementNextEventNumberFnFake,
    })(req, res);

    expect(nextEventNumberFnFake).to.have.been.calledWith({ root });
    expect(streamFnFake).to.have.been.calledWith({ root, from });

    const number = "some-number";
    const event = {
      headers: { number },
    };

    await streamFnFake.lastCall.lastArg(event);

    expect(mainFnFake).to.have.been.calledWith(event);
    expect(incrementNextEventNumberFnFake).to.have.been.calledWith({
      root,
      from: number,
    });

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should throw if bad data format", async () => {
    const mainFnFake = fake();

    const data = Buffer.from("bad");
    const req = {
      body: {
        message: { data },
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await post({ mainFn: mainFnFake })(req, res);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("Invalid data format.");
      expect(e).to.equal(error);
    }
  });
  it("should throw if number is wrong", async () => {
    const mainFnFake = fake();
    const nextEventNumberFnFake = fake.returns(from + 1);

    const req = {
      body: {
        message: { data },
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "preconditionFailedError", {
      message: messageFake,
    });
    try {
      await post({
        mainFn: mainFnFake,
        nextEventNumberFn: nextEventNumberFnFake,
      })(req, res);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "The event was received out of order."
      );
      expect(e).to.equal(error);
    }
  });
});
