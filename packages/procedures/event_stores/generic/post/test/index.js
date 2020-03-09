const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, fake, stub, replace, useFakeTimers } = require("sinon");

const post = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const root = "some-root";
const domain = "some-domain";
const service = "some-service";

const topic = `did-something.${domain}.${service}`;
const idempotency = "some-idempotency";

const events = [
  {
    data: {
      headers: {
        b: 2,
        root,
        topic,
        idempotency
      },
      a: 1
    }
  }
];
const lastEventNumber = 4;

const aggregate = { headers: { lastEventNumber, root } };

process.env.DOMAIN = domain;
process.env.SERVICE = service;

describe("Event store post", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const writtenEvents = "some-written-events";
    const saveEventsFnFake = fake.returns(writtenEvents);
    const aggregateFnFake = fake.returns(aggregate);
    const publishFnFake = fake();

    const req = {
      body: {
        events
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
      saveEventsFn: saveEventsFnFake,
      aggregateFn: aggregateFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${lastEventNumber + 1}`,
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root,
          number: lastEventNumber + 1,
          topic,
          idempotency
        }
      }
    ]);
    expect(aggregateFnFake).to.have.been.calledWith(root);
    expect(publishFnFake).to.have.been.calledWith(writtenEvents);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with correct number", async () => {
    const writtenEvents = "some-written-events";
    const saveEventsFnFake = fake.returns(writtenEvents);
    const aggregateFnFake = fake.returns(aggregate);
    const publishFnFake = fake();

    const req = {
      body: {
        events: [
          {
            ...events[0],
            number: lastEventNumber + 1
          }
        ]
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
      saveEventsFn: saveEventsFnFake,
      aggregateFn: aggregateFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${lastEventNumber + 1}`,
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root,
          number: lastEventNumber + 1,
          topic,
          idempotency
        }
      }
    ]);
    expect(aggregateFnFake).to.have.been.calledWith(root);
    expect(publishFnFake).to.have.been.calledWith(writtenEvents);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with multiple events with the same root", async () => {
    const writtenEvents = "some-written-events";
    const saveEventsFnFake = fake.returns(writtenEvents);
    const aggregateFnFake = stub()
      .onFirstCall()
      .returns(aggregate)
      .onSecondCall()
      .returns({ headers: { lastEventNumber: 9, root: "some-other-root" } });

    const publishFnFake = fake();

    const req = {
      body: {
        events: [
          ...events,
          ...events,
          {
            data: {
              headers: {
                b: 2,
                root: "some-other-root",
                topic,
                idempotency
              },
              a: 1
            }
          }
        ]
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
      saveEventsFn: saveEventsFnFake,
      aggregateFn: aggregateFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${lastEventNumber + 1}`,
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root,
          number: lastEventNumber + 1,
          topic,
          idempotency
        }
      },
      {
        id: `${root}_${lastEventNumber + 2}`,
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root,
          number: lastEventNumber + 2,
          topic,
          idempotency
        }
      },
      {
        id: "some-other-root_10",
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root: "some-other-root",
          number: 10,
          topic,
          idempotency
        }
      }
    ]);
    expect(aggregateFnFake).to.have.been.calledWith(root);
    expect(publishFnFake).to.have.been.calledWith(writtenEvents);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with default idempotency", async () => {
    const writtenEvents = ["some-written-event"];
    const saveEventsFnFake = fake.returns(writtenEvents);
    const aggregateFnFake = fake.returns(aggregate);
    const publishFnFake = fake();

    const req = {
      body: {
        events: [
          {
            data: {
              headers: {
                b: 2,
                root,
                topic
              },
              a: 1
            }
          }
        ]
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    const uuid = "some-uuid";
    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);

    await post({
      saveEventsFn: saveEventsFnFake,
      aggregateFn: aggregateFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${lastEventNumber + 1}`,
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root,
          number: lastEventNumber + 1,
          topic,
          idempotency: uuid
        }
      }
    ]);
    expect(aggregateFnFake).to.have.been.calledWith(root);
    expect(publishFnFake).to.have.been.calledWith(writtenEvents);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should call with last event number as 0 if there is no aggregate", async () => {
    const writtenEvents = ["some-written-event"];
    const saveEventsFnFake = fake.returns(writtenEvents);
    const aggregateFnFake = fake();
    const publishFnFake = fake();

    const req = {
      body: {
        events
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
      saveEventsFn: saveEventsFnFake,
      aggregateFn: aggregateFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${0}`,
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root,
          number: 0,
          topic,
          idempotency
        }
      }
    ]);
    expect(aggregateFnFake).to.have.been.calledWith(root);
    expect(publishFnFake).to.have.been.calledWith(writtenEvents);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should throw if event number is incorrect", async () => {
    const writtenEvents = ["some-written-event"];
    const saveEventsFnFake = fake.returns(writtenEvents);
    const aggregateFnFake = fake();
    const publishFnFake = fake();

    const req = {
      body: {
        events: [
          {
            ...events[0],
            number: lastEventNumber
          }
        ]
      }
    };

    try {
      await post({
        saveEventsFn: saveEventsFnFake,
        aggregateFn: aggregateFnFake,
        publishFn: publishFnFake
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(412);
    }
  });

  it("should throw correctly", async () => {
    const error = new Error();
    const writtenEvents = ["some-written-event"];
    const saveEventsFnFake = fake.returns(writtenEvents);
    const aggregateFnFake = fake.rejects(error);
    const publishFnFake = fake();

    const req = {
      body: {
        events
      }
    };

    try {
      await post({
        saveEventsFn: saveEventsFnFake,
        aggregateFn: aggregateFnFake,
        publishFn: publishFnFake
      })(req);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw with bad topic domain", async () => {
    const publishFnFake = fake();
    const aggregateFnFake = fake();

    const req = {
      body: {
        events: [
          {
            data: {
              headers: {
                topic: `did-something.some-bad-domain.${service}`
              }
            }
          }
        ]
      }
    };

    try {
      await post({
        publishFn: publishFnFake,
        aggregateFn: aggregateFnFake
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
  it("should throw with bad topic service", async () => {
    const publishFnFake = fake();
    const aggregateFnFake = fake();

    const req = {
      body: {
        events: [
          {
            data: {
              headers: {
                topic: `did-something.${domain}.some-bad-service`
              }
            }
          }
        ]
      }
    };

    try {
      await post({
        publishFn: publishFnFake,
        aggregateFn: aggregateFnFake
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
});
