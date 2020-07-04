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

const topic = `${domain}.${service}`;
const idempotency = "some-idempotency";

const eventRoot = "some-event-root";
const eventNumber = "some-event-number";
const eventTopic = "some-event-topic";

const writtenEvent = {
  root: eventRoot,
  headers: {
    number: eventNumber,
    topic: eventTopic,
  },
};
const writtenEvents = [writtenEvent];

const events = [
  {
    data: {
      root,
      headers: {
        b: 2,
        topic,
        idempotency,
      },
      a: 1,
    },
  },
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
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const publishFnFake = fake();

    const req = {
      body: {
        events,
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    await post({
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
      publishFn: publishFnFake,
    })(req, res);

    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${currentEventsForRoot}`,
        saved: deps.dateString(),
        a: 1,
        root,
        headers: {
          b: 2,
          number: currentEventsForRoot,
          topic,
          idempotency,
        },
      },
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
    });
    expect(publishFnFake).to.have.been.calledWith(
      { root: eventRoot },
      eventTopic
    );
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with correct number", async () => {
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const publishFnFake = fake();

    const req = {
      body: {
        events: [
          {
            ...events[0],
            number: currentEventsForRoot,
          },
        ],
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    await post({
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
      publishFn: publishFnFake,
    })(req, res);
    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${currentEventsForRoot}`,
        saved: deps.dateString(),
        a: 1,
        root,
        headers: {
          b: 2,
          number: currentEventsForRoot,
          topic,
          idempotency,
        },
      },
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
    });
    expect(publishFnFake).to.have.been.calledWith(
      { root: eventRoot },
      eventTopic
    );
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with multiple events with the same root and different roots", async () => {
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
              root: "some-other-root",
              headers: {
                b: 2,
                topic,
                idempotency,
              },
              a: 1,
            },
          },
        ],
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    await post({
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
      publishFn: publishFnFake,
    })(req, res);
    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${currentEventsForRoot}`,
        saved: deps.dateString(),
        a: 1,
        root,
        headers: {
          b: 2,
          number: currentEventsForRoot,
          topic,
          idempotency,
        },
      },
      {
        id: `${root}_${currentEventsForRoot + 1}`,
        saved: deps.dateString(),
        a: 1,
        root,
        headers: {
          b: 2,
          number: currentEventsForRoot + 1,
          topic,
          idempotency,
        },
      },
      {
        id: "some-other-root_9",
        saved: deps.dateString(),
        a: 1,
        root: "some-other-root",
        headers: {
          b: 2,
          number: 9,
          topic,
          idempotency,
        },
      },
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 2,
    });
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root: "some-other-root",
      amount: 1,
    });
    expect(reserveRootCountsFnFake).to.have.been.calledTwice;
    expect(publishFnFake).to.have.been.calledWith(
      { root: eventRoot },
      eventTopic
    );
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with default idempotency", async () => {
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const publishFnFake = fake();

    const req = {
      body: {
        events: [
          {
            data: {
              root,
              headers: {
                b: 2,
                topic,
              },
              a: 1,
            },
          },
        ],
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const uuid = "some-uuid";
    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);

    await post({
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
      publishFn: publishFnFake,
    })(req, res);
    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        id: `${root}_${currentEventsForRoot}`,
        saved: deps.dateString(),
        a: 1,
        root,
        headers: {
          b: 2,
          number: currentEventsForRoot,
          topic,
          idempotency: uuid,
        },
      },
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
    });
    expect(publishFnFake).to.have.been.calledWith(
      { root: eventRoot },
      eventTopic
    );
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should throw if event number is incorrect", async () => {
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const publishFnFake = fake();

    const req = {
      body: {
        events: [
          {
            ...events[0],
            number: currentEventsForRoot + 1,
          },
        ],
      },
    };

    try {
      await post({
        saveEventsFn: saveEventsFnFake,
        reserveRootCountsFn: reserveRootCountsFnFake,
        publishFn: publishFnFake,
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(412);
    }
  });

  it("should throw correctly", async () => {
    const error = new Error();
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.rejects(error);
    const publishFnFake = fake();

    const req = {
      body: {
        events,
      },
    };

    try {
      await post({
        saveEventsFn: saveEventsFnFake,
        reserveRootCountsFn: reserveRootCountsFnFake,
        publishFn: publishFnFake,
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
                topic: `some-bad-domain.${service}`,
              },
            },
          },
        ],
      },
    };

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await post({
        publishFn: publishFnFake,
        reserveRootCountsFn: reserveRootCountsFnFake,
      })(req);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This event store can't accept this event."
      );
      expect(e).to.equal(error);
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
                topic: `${domain}.some-bad-service`,
              },
            },
          },
        ],
      },
    };

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await post({
        publishFn: publishFnFake,
        reserveRootCountsFn: reserveRootCountsFnFake,
      })(req);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This event store can't accept this event."
      );
      expect(e).to.equal(error);
    }
  });
});
