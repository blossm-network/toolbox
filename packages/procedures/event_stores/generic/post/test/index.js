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
const currentEventsForRoot = 0;

const reserveRootCount = { root, value: currentEventsForRoot + events.length };

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
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
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
      reserveRootCountsFn: reserveRootCountsFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${currentEventsForRoot}`,
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root,
          number: currentEventsForRoot,
          topic,
          idempotency
        }
      }
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1
    });
    expect(publishFnFake).to.have.been.calledWith(writtenEvents);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with correct number", async () => {
    const writtenEvents = "some-written-events";
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const publishFnFake = fake();

    const req = {
      body: {
        events: [
          {
            ...events[0],
            number: currentEventsForRoot
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
      reserveRootCountsFn: reserveRootCountsFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${currentEventsForRoot}`,
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root,
          number: currentEventsForRoot,
          topic,
          idempotency
        }
      }
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1
    });
    expect(publishFnFake).to.have.been.calledWith(writtenEvents);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with multiple events with the same root and different roots", async () => {
    const writtenEvents = "some-written-events";
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = stub()
      .onFirstCall()
      .returns({ value: currentEventsForRoot + 2, root })
      .onSecondCall()
      .returns({ value: 10, root: "some-other-root" });

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
      reserveRootCountsFn: reserveRootCountsFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${currentEventsForRoot}`,
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root,
          number: currentEventsForRoot,
          topic,
          idempotency
        }
      },
      {
        id: `${root}_${currentEventsForRoot + 1}`,
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root,
          number: currentEventsForRoot + 1,
          topic,
          idempotency
        }
      },
      {
        id: "some-other-root_9",
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root: "some-other-root",
          number: 9,
          topic,
          idempotency
        }
      }
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 2
    });
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root: "some-other-root",
      amount: 1
    });
    expect(reserveRootCountsFnFake).to.have.been.calledTwice;
    expect(publishFnFake).to.have.been.calledWith(writtenEvents);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with default idempotency", async () => {
    const writtenEvents = ["some-written-event"];
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
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
      reserveRootCountsFn: reserveRootCountsFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${currentEventsForRoot}`,
        saved: deps.dateString(),
        a: 1,
        headers: {
          b: 2,
          root,
          number: currentEventsForRoot,
          topic,
          idempotency: uuid
        }
      }
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1
    });
    expect(publishFnFake).to.have.been.calledWith(writtenEvents);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should throw if event number is incorrect", async () => {
    const writtenEvents = ["some-written-event"];
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const publishFnFake = fake();

    const req = {
      body: {
        events: [
          {
            ...events[0],
            number: 1
          }
        ]
      }
    };

    try {
      await post({
        saveEventsFn: saveEventsFnFake,
        reserveRootCountsFn: reserveRootCountsFnFake,
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
    const reserveRootCountsFnFake = fake.rejects(error);
    const publishFnFake = fake();

    const req = {
      body: {
        events
      }
    };

    try {
      await post({
        saveEventsFn: saveEventsFnFake,
        reserveRootCountsFn: reserveRootCountsFnFake,
        publishFn: publishFnFake
      })(req);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw with bad topic domain", async () => {
    const publishFnFake = fake();
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);

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
        reserveRootCountsFn: reserveRootCountsFnFake
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
  it("should throw with bad topic service", async () => {
    const publishFnFake = fake();
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);

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
        reserveRootCountsFn: reserveRootCountsFnFake
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
});
