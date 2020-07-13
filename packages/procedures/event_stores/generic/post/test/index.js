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

const id = "some-id";
const transaction = "some-transaction";

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
    const proofsFnFake = fake.returns([
      {
        a: 1,
      },
    ]);
    const saveProofsFnFake = fake();

    const scheduleUpdateForProofFake = fake();
    const startTransactionFnFake = fake.returns(transaction);
    const commitTransactionFnFake = fake();

    const uuidFake = fake.returns(id);
    replace(deps, "uuid", uuidFake);

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
      proofsFn: proofsFnFake,
      saveProofsFn: saveProofsFnFake,
      scheduleUpdateForProof: scheduleUpdateForProofFake,
      startTransactionFn: startTransactionFnFake,
      commitTransactionFn: commitTransactionFnFake,
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
        proofs: [id],
      },
    ]);
    expect(saveProofsFnFake).to.have.been.calledWith([{ id, a: 1 }]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
      transaction,
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
    expect(proofsFnFake).to.have.been.calledWith(hash);
    expect(publishFnFake).to.have.been.calledWith(
      { root: eventRoot },
      eventTopic
    );
    expect(scheduleUpdateForProofFake.getCall(0)).to.have.been.calledWith({
      id,
      a: 1,
    });
    expect(scheduleUpdateForProofFake).to.have.been.calledOnce;
    expect(startTransactionFnFake).to.have.been.calledWith();
    expect(commitTransactionFnFake).to.have.been.calledWith(transaction);
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
    const proofsFnFake = fake.returns([{ a: 1 }]);
    const saveProofsFnFake = fake();

    const scheduleUpdateForProofFake = fake();
    const startTransactionFnFake = fake.returns(transaction);
    const commitTransactionFnFake = fake();

    const uuidFake = fake.returns(id);
    replace(deps, "uuid", uuidFake);

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
      proofsFn: proofsFnFake,
      saveProofsFn: saveProofsFnFake,
      scheduleUpdateForProof: scheduleUpdateForProofFake,
      startTransactionFn: startTransactionFnFake,
      commitTransactionFn: commitTransactionFnFake,
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
        proofs: [id],
      },
    ]);
    expect(saveProofsFnFake).to.have.been.calledWith([{ id, a: 1 }]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
      transaction,
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
    expect(proofsFnFake).to.have.been.calledWith(hash);
    expect(publishFnFake).to.have.been.calledWith(
      { root: eventRoot },
      eventTopic
    );
    expect(scheduleUpdateForProofFake.getCall(0)).to.have.been.calledWith({
      id,
      a: 1,
    });
    expect(scheduleUpdateForProofFake).to.have.been.calledOnce;
    expect(startTransactionFnFake).to.have.been.calledWith();
    expect(commitTransactionFnFake).to.have.been.calledWith(transaction);
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

    const proofsFnFake = stub()
      .onFirstCall()
      .returns([{ a: 1 }])
      .onSecondCall()
      .returns([{ b: 2 }])
      .onThirdCall()
      .returns([{ c: 3 }, { d: 4 }]);
    const saveProofsFnFake = fake();

    const id1 = "some-id1";
    const id2 = "some-id2";
    const id3 = "some-id3";
    const id4 = "some-id4";

    const scheduleUpdateForProofFake = fake();
    const startTransactionFnFake = fake.returns(transaction);
    const commitTransactionFnFake = fake();

    const uuidFake = stub()
      .onFirstCall()
      .returns(id1)
      .onSecondCall()
      .returns(id2)
      .onThirdCall()
      .returns(id3)
      .onCall(3)
      .returns(id4);

    replace(deps, "uuid", uuidFake);

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
      proofsFn: proofsFnFake,
      saveProofsFn: saveProofsFnFake,
      scheduleUpdateForProof: scheduleUpdateForProofFake,
      startTransactionFn: startTransactionFnFake,
      commitTransactionFn: commitTransactionFnFake,
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
        proofs: [id1],
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
        hash: hash2,
        proofs: [id2],
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
        hash: hash3,
        proofs: [id3, id4],
      },
    ]);
    expect(saveProofsFnFake).to.have.been.calledWith([
      { id: id1, a: 1 },
      { id: id2, b: 2 },
      { id: id3, c: 3 },
      { id: id4, d: 4 },
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 2,
      transaction,
    });
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root: "some-other-root",
      amount: 1,
      transaction,
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
    expect(hashFnFake.getCall(2)).to.have.been.calledWith({
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
    expect(proofsFnFake.getCall(0)).to.have.been.calledWith(hash1);
    expect(proofsFnFake.getCall(1)).to.have.been.calledWith(hash2);
    expect(proofsFnFake.getCall(2)).to.have.been.calledWith(hash3);
    expect(publishFnFake).to.have.been.calledWith(
      { root: eventRoot },
      eventTopic
    );
    expect(scheduleUpdateForProofFake.getCall(0)).to.have.been.calledWith({
      id: id1,
      a: 1,
    });
    expect(scheduleUpdateForProofFake.getCall(1)).to.have.been.calledWith({
      id: id2,
      b: 2,
    });
    expect(scheduleUpdateForProofFake.getCall(2)).to.have.been.calledWith({
      id: id3,
      c: 3,
    });
    expect(scheduleUpdateForProofFake.getCall(3)).to.have.been.calledWith({
      id: id4,
      d: 4,
    });
    expect(scheduleUpdateForProofFake).to.have.callCount(4);
    expect(startTransactionFnFake).to.have.been.calledWith();
    expect(commitTransactionFnFake).to.have.been.calledWith(transaction);
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params if transaction is null", async () => {
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const publishFnFake = fake();
    const hashFnFake = fake.returns(hash);
    const proofsFnFake = fake.returns([
      {
        a: 1,
      },
    ]);
    const saveProofsFnFake = fake();

    const scheduleUpdateForProofFake = fake();
    const startTransactionFnFake = fake();
    const commitTransactionFnFake = fake();

    const uuidFake = fake.returns(id);
    replace(deps, "uuid", uuidFake);

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
      proofsFn: proofsFnFake,
      saveProofsFn: saveProofsFnFake,
      scheduleUpdateForProof: scheduleUpdateForProofFake,
      startTransactionFn: startTransactionFnFake,
      commitTransactionFn: commitTransactionFnFake,
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
        proofs: [id],
      },
    ]);
    expect(saveProofsFnFake).to.have.been.calledWith([{ id, a: 1 }]);
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
    expect(proofsFnFake).to.have.been.calledWith(hash);
    expect(publishFnFake).to.have.been.calledWith(
      { root: eventRoot },
      eventTopic
    );
    expect(scheduleUpdateForProofFake.getCall(0)).to.have.been.calledWith({
      id,
      a: 1,
    });
    expect(scheduleUpdateForProofFake).to.have.been.calledOnce;
    expect(startTransactionFnFake).to.have.been.calledWith();
    expect(commitTransactionFnFake).to.not.have.been.called;
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should throw if event number is incorrect", async () => {
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const publishFnFake = fake();
    const startTransactionFnFake = fake.returns(transaction);

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
        startTransactionFn: startTransactionFnFake,
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

    const startTransactionFnFake = fake.returns(transaction);
    try {
      await post({
        saveEventsFn: saveEventsFnFake,
        reserveRootCountsFn: reserveRootCountsFnFake,
        publishFn: publishFnFake,
        startTransactionFn: startTransactionFnFake,
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
    const startTransactionFnFake = fake.returns(transaction);
    try {
      await post({
        publishFn: publishFnFake,
        reserveRootCountsFn: reserveRootCountsFnFake,
        startTransactionFn: startTransactionFnFake,
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
    const startTransactionFnFake = fake.returns(transaction);
    try {
      await post({
        publishFn: publishFnFake,
        reserveRootCountsFn: reserveRootCountsFnFake,
        startTransactionFn: startTransactionFnFake,
      })(req);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This event store can't accept this event."
      );
      expect(e).to.equal(error);
    }
  });
});
