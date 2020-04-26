const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");

const post = require("..");
const deps = require("../deps");

const number = "some-number";
const root = "some-root";

const data = Buffer.from(JSON.stringify({ root }));

const action = "some-action";
process.env.EVENT_ACTION = action;

describe("Command handler post", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const state = "some-state";
    const mainFnFake = fake.returns(state);
    const commitFnFake = fake();
    const streamFnFake = fake();
    const nextEventNumberFnFake = fake.returns(number);
    const saveNextEventNumberFnFake = fake();

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
      commitFn: commitFnFake,
      streamFn: streamFnFake,
      nextEventNumberFn: nextEventNumberFnFake,
      saveNextEventNumberFn: saveNextEventNumberFnFake,
    })(req, res);

    expect(nextEventNumberFnFake).to.have.been.calledWith({ root });
    expect(streamFnFake).to.have.been.calledWith({ root, from: number });

    const eventNumber = "some-number";
    const event = {
      headers: {
        number: eventNumber,
        action,
      },
    };

    streamFnFake.lastCall.lastArg(event);

    expect(mainFnFake).to.have.been.calledWith(undefined, event);
    expect(commitFnFake).to.not.have.been.called;
    expect(saveNextEventNumberFnFake).to.not.have.been.called;

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params if forced", async () => {
    const mainFnFake = fake();
    const streamFnFake = fake();
    const saveNextEventNumberFnFake = fake();
    const nextEventNumberFnFake = fake.returns(number);

    const forceFrom = "some-force-number";
    const data = Buffer.from(JSON.stringify({ root, forceFrom }));
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
      saveNextEventNumberFn: saveNextEventNumberFnFake,
    })(req, res);

    expect(nextEventNumberFnFake).to.not.have.been.called;
    expect(streamFnFake).to.have.been.calledWith({ root, from: forceFrom });

    const eventNumber = "some-number";
    const event = {
      headers: { number: eventNumber, action },
    };

    await streamFnFake.lastCall.lastArg(event);

    expect(mainFnFake).to.have.been.calledWith(undefined, event);
    expect(saveNextEventNumberFnFake).to.not.have.been.called;

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params and skip calling main if action is different", async () => {
    const mainFnFake = fake();
    const streamFnFake = fake();
    const nextEventNumberFnFake = fake.returns(number);
    const saveNextEventNumberFnFake = fake();

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
      saveNextEventNumberFn: saveNextEventNumberFnFake,
    })(req, res);

    expect(nextEventNumberFnFake).to.have.been.calledWith({ root });
    expect(streamFnFake).to.have.been.calledWith({ root, from: number });

    const eventNumber = "some-number";
    const event = {
      headers: {
        number: eventNumber,
        action: "some-bogus",
      },
    };

    await streamFnFake.lastCall.lastArg(event);

    expect(mainFnFake).to.not.have.been.called;
    expect(saveNextEventNumberFnFake).to.not.have.been.called;

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
});
