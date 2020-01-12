const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, fake, useFakeTimers } = require("sinon");

const post = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const root = "some-root";
const event = {
  headers: {
    b: 2,
    root
  },
  a: 1
};
const lastEventNumber = 4;
const aggregate = { headers: { lastEventNumber } };

describe("Event store post", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const writtenEvent = "some-written-event";
    const saveEventFnFake = fake.returns(writtenEvent);
    const aggregateFnFake = fake.returns(aggregate);
    const publishFnFake = fake();

    const req = {
      body: {
        event
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await post({
      saveEventFn: saveEventFnFake,
      aggregateFn: aggregateFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventFnFake).to.have.been.calledWith({
      id: `${root}_${lastEventNumber + 1}`,
      saved: deps.dateString(),
      a: 1,
      headers: {
        b: 2,
        root,
        number: lastEventNumber + 1
      }
    });
    expect(aggregateFnFake).to.have.been.calledWith(root);
    expect(publishFnFake).to.have.been.calledWith(writtenEvent);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should call with last event number as 0 if there is no aggregate", async () => {
    const writtenEvent = "some-written-event";
    const saveEventFnFake = fake.returns(writtenEvent);
    const aggregateFnFake = fake();
    const publishFnFake = fake();

    const req = {
      body: {
        event
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await post({
      saveEventFn: saveEventFnFake,
      aggregateFn: aggregateFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventFnFake).to.have.been.calledWith({
      id: `${root}_${0}`,
      saved: deps.dateString(),
      a: 1,
      headers: {
        b: 2,
        root,
        number: 0
      }
    });
    expect(aggregateFnFake).to.have.been.calledWith(root);
    expect(publishFnFake).to.have.been.calledWith(writtenEvent);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should throw if event number is incorrect", async () => {
    const writtenEvent = "some-written-event";
    const saveEventFnFake = fake.returns(writtenEvent);
    const aggregateFnFake = fake();
    const publishFnFake = fake();

    const req = {
      body: {
        event,
        number: lastEventNumber
      }
    };

    try {
      await post({
        saveEventFn: saveEventFnFake,
        aggregateFn: aggregateFnFake,
        publishFn: publishFnFake
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(412);
    }
  });

  it("should throw correctly", async () => {
    const error = new Error();
    const writtenEvent = "some-written-event";
    const saveEventFnFake = fake.returns(writtenEvent);
    const aggregateFnFake = fake.rejects(error);
    const publishFnFake = fake();

    const req = {
      body: {
        event
      }
    };

    try {
      await post({
        saveEventFn: saveEventFnFake,
        aggregateFn: aggregateFnFake,
        publishFn: publishFnFake
      })(req);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
