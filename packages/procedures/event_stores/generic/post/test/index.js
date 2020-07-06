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
  data: {
    root: eventRoot,
    number: eventNumber,
    headers: {
      topic: eventTopic,
    },
  },
};
const writtenEvents = [writtenEvent];

const payload = { a: 1 };
const events = [
  {
    data: {
      root,
      headers: {
        b: 2,
        topic,
        idempotency,
      },
      payload,
    },
  },
];
const currentEventsForRoot = 0;
const hash = "some-hash";
const proofId = "some-proof-id";
const proofType = "some-proof-type";

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
    const hashFnFake = fake.returns(hash);
    const proofFnFake = fake.returns({ id: proofId, type: proofType });

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
      hashFn: hashFnFake,
      proofFn: proofFnFake,
    })(req, res);

    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        data: {
          id: `${root}_${currentEventsForRoot}`,
          saved: deps.dateString(),
          payload,
          root,
          number: currentEventsForRoot,
          headers: {
            b: 2,
            topic,
            idempotency,
          },
        },
        hash,
        proof: { type: proofType, id: proofId },
      },
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
    });
    expect(hashFnFake).to.have.been.calledWith({
      id: `${root}_${currentEventsForRoot}`,
      saved: deps.dateString(),
      payload,
      root,
      number: currentEventsForRoot,
      headers: {
        b: 2,
        topic,
        idempotency,
      },
    });
    expect(proofFnFake).to.have.been.calledWith(hash);
    expect(publishFnFake).to.have.been.calledWith(
      { root: eventRoot },
      eventTopic
    );
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with correct number", async () => {
    const saveEventsFnFake = fake.returns(writtenEvents);
    const number = currentEventsForRoot + 12;
    const reserveRootCount = {
      root,
      value: number + events.length,
    };
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const publishFnFake = fake();
    const hashFnFake = fake.returns(hash);
    const proofFnFake = fake.returns({ id: proofId, type: proofType });

    const req = {
      body: {
        events: [
          {
            ...events[0],
            number,
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
      hashFn: hashFnFake,
      proofFn: proofFnFake,
    })(req, res);

    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        data: {
          id: `${root}_${number}`,
          saved: deps.dateString(),
          payload,
          root,
          number,
          headers: {
            b: 2,
            topic,
            idempotency,
          },
        },
        hash,
        proof: { type: proofType, id: proofId },
      },
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
    });
    expect(hashFnFake).to.have.been.calledWith({
      id: `${root}_${number}`,
      saved: deps.dateString(),
      payload,
      root,
      number,
      headers: {
        b: 2,
        topic,
        idempotency,
      },
    });
    expect(proofFnFake).to.have.been.calledWith(hash);
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
    const hash1 = "some-hash1";
    const hash2 = "some-hash2";
    const hash3 = "some-hash3";

    const hashFnFake = stub()
      .onFirstCall()
      .returns(hash1)
      .onSecondCall()
      .returns(hash2)
      .onThirdCall()
      .returns(hash3);

    const proofId1 = "some-proof-id1";
    const proofId2 = "some-proof-id2";
    const proofId3 = "some-proof-id3";
    const proofType1 = "some-proof-type1";
    const proofType2 = "some-proof-type2";
    const proofType3 = "some-proof-type3";

    const proofFnFake = stub()
      .onFirstCall()
      .returns({ id: proofId1, type: proofType1 })
      .onSecondCall()
      .returns({ id: proofId2, type: proofType2 })
      .onThirdCall()
      .returns({ id: proofId3, type: proofType3 });

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
              payload,
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
      hashFn: hashFnFake,
      proofFn: proofFnFake,
    })(req, res);

    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        data: {
          id: `${root}_${currentEventsForRoot}`,
          saved: deps.dateString(),
          payload,
          root,
          number: currentEventsForRoot,
          headers: {
            b: 2,
            topic,
            idempotency,
          },
        },
        hash: hash1,
        proof: { type: proofType1, id: proofId1 },
      },
      {
        data: {
          id: "some-other-root_9",
          saved: deps.dateString(),
          payload,
          root: "some-other-root",
          number: 9,
          headers: {
            b: 2,
            topic,
            idempotency,
          },
        },
        hash: hash2,
        proof: { type: proofType2, id: proofId2 },
      },
      {
        data: {
          id: `${root}_${currentEventsForRoot + 1}`,
          saved: deps.dateString(),
          payload,
          root,
          number: currentEventsForRoot + 1,
          headers: {
            b: 2,
            topic,
            idempotency,
          },
        },
        hash: hash3,
        proof: { type: proofType3, id: proofId3 },
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
    expect(hashFnFake.getCall(0)).to.have.been.calledWith({
      id: `${root}_${currentEventsForRoot}`,
      saved: deps.dateString(),
      payload,
      root,
      number: currentEventsForRoot,
      headers: {
        b: 2,
        topic,
        idempotency,
      },
    });
    expect(hashFnFake.getCall(1)).to.have.been.calledWith({
      id: "some-other-root_9",
      saved: deps.dateString(),
      payload,
      root: "some-other-root",
      number: 9,
      headers: {
        b: 2,
        topic,
        idempotency,
      },
    });
    expect(hashFnFake.getCall(2)).to.have.been.calledWith({
      id: `${root}_${currentEventsForRoot + 1}`,
      saved: deps.dateString(),
      payload,
      root,
      number: currentEventsForRoot + 1,
      headers: {
        b: 2,
        topic,
        idempotency,
      },
    });
    expect(proofFnFake.getCall(0)).to.have.been.calledWith(hash1);
    expect(proofFnFake.getCall(1)).to.have.been.calledWith(hash2);
    expect(proofFnFake.getCall(2)).to.have.been.calledWith(hash3);
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
    const hashFnFake = fake.returns(hash);
    const proofFnFake = fake.returns({ id: proofId, type: proofType });

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
              payload,
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
      hashFn: hashFnFake,
      proofFn: proofFnFake,
    })(req, res);

    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        data: {
          id: `${root}_${currentEventsForRoot}`,
          saved: deps.dateString(),
          payload,
          root,
          number: currentEventsForRoot,
          headers: {
            b: 2,
            topic,
            idempotency: uuid,
          },
        },
        hash,
        proof: { type: proofType, id: proofId },
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
