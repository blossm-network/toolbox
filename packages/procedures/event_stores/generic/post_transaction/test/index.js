const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, fake, stub, replace, useFakeTimers } = require("sinon");

const postTransaction = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const root = "some-root";
const domain = "some-domain";
const service = "some-service";

const topic = `some-action.${domain}.${service}`;
const idempotency = "some-idempotency";
const created = "some-created";

const eventRoot = "some-event-root";
const eventNumber = "some-event-number";
const eventTopic = "some-event-topic";

const id = "some-id";
const transaction = "some-transaction";

const writtenEvent = {
  data: {
    root: eventRoot,
    number: eventNumber,
    topic: eventTopic,
  },
};
const writtenEvents = [writtenEvent];

const payload = { a: 1 };
const headers = { b: 2 };
const events = [
  {
    data: {
      root,
      headers,
      topic,
      created,
      idempotency,
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
    const hashFnFake = fake.returns(hash);

    const uuidFake = fake.returns(id);
    replace(deps, "uuid", uuidFake);

    const result = await postTransaction({
      events,
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
      hashFn: hashFnFake,
    })(transaction);

    expect(result).to.deep.equal({
      events: writtenEvents,
    });

    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        data: {
          id: `${root}_${currentEventsForRoot}`,
          created,
          payload,
          root,
          number: currentEventsForRoot,
          headers,
          topic,
          idempotency,
        },
        hash,
      },
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
      transaction,
    });
    expect(hashFnFake).to.have.been.calledWith({
      id: `${root}_${currentEventsForRoot}`,
      created,
      payload,
      root,
      number: currentEventsForRoot,
      headers,
      topic,
      idempotency,
    });
  });
  it("should call with the correct params with correct number", async () => {
    const saveEventsFnFake = fake.returns(writtenEvents);
    const number = currentEventsForRoot + 12;
    const reserveRootCount = {
      root,
      value: number + events.length,
    };
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const hashFnFake = fake.returns(hash);

    const uuidFake = fake.returns(id);
    replace(deps, "uuid", uuidFake);

    const result = await postTransaction({
      events: [
        {
          ...events[0],
          number,
        },
      ],
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
      hashFn: hashFnFake,
    })(transaction);

    expect(result).to.deep.equal({
      events: writtenEvents,
    });

    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        data: {
          id: `${root}_${number}`,
          created,
          payload,
          root,
          number,
          headers,
          topic,
          idempotency,
        },
        hash,
      },
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
      transaction,
    });
    expect(hashFnFake).to.have.been.calledWith({
      id: `${root}_${number}`,
      created,
      payload,
      root,
      number,
      headers,
      topic,
      idempotency,
    });
  });
  it("should call with the correct params with multiple events with the same root and different roots", async () => {
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = stub()
      .onFirstCall()
      .returns({ value: currentEventsForRoot + 2, root })
      .onSecondCall()
      .returns({ value: 10, root: "some-other-root" });

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

    const id1 = "some-id1";
    const id2 = "some-id2";
    const id3 = "some-id3";
    const id4 = "some-id4";

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

    const result = await postTransaction({
      events: [
        ...events,
        ...events,
        {
          data: {
            root: "some-other-root",
            headers,
            topic,
            created,
            idempotency,
            payload,
          },
        },
      ],
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
      hashFn: hashFnFake,
    })(transaction);

    expect(result).to.deep.equal({
      events: writtenEvents,
    });

    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        data: {
          id: `${root}_${currentEventsForRoot}`,
          created,
          payload,
          root,
          number: currentEventsForRoot,
          headers,
          topic,
          idempotency,
        },
        hash: hash1,
      },
      {
        data: {
          id: `${root}_${currentEventsForRoot + 1}`,
          created,
          payload,
          root,
          number: currentEventsForRoot + 1,
          headers,
          topic,
          idempotency,
        },
        hash: hash2,
      },
      {
        data: {
          id: "some-other-root_9",
          created,
          payload,
          root: "some-other-root",
          number: 9,
          headers,
          topic,
          idempotency,
        },
        hash: hash3,
      },
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
      created,
      payload,
      root,
      number: currentEventsForRoot,
      headers,
      topic,
      idempotency,
    });
    expect(hashFnFake.getCall(1)).to.have.been.calledWith({
      id: `${root}_${currentEventsForRoot + 1}`,
      created,
      payload,
      root,
      number: currentEventsForRoot + 1,
      headers,
      topic,
      idempotency,
    });
    expect(hashFnFake.getCall(2)).to.have.been.calledWith({
      id: "some-other-root_9",
      created,
      payload,
      root: "some-other-root",
      number: 9,
      headers,
      topic,
      idempotency,
    });
  });
  it("should call with the correct params if transaction is null", async () => {
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const hashFnFake = fake.returns(hash);

    const uuidFake = fake.returns(id);
    replace(deps, "uuid", uuidFake);

    const result = await postTransaction({
      events,
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
      hashFn: hashFnFake,
    })();

    expect(result).to.deep.equal({
      events: writtenEvents,
    });

    expect(saveEventsFnFake).to.have.been.calledWith([
      {
        data: {
          id: `${root}_${currentEventsForRoot}`,
          created,
          payload,
          root,
          number: currentEventsForRoot,
          headers,
          topic,
          idempotency,
        },
        hash,
      },
    ]);
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
    });
    expect(hashFnFake).to.have.been.calledWith({
      id: `${root}_${currentEventsForRoot}`,
      created,
      payload,
      root,
      number: currentEventsForRoot,
      headers,
      topic,
      idempotency,
    });
  });
  it("should throw if event number is incorrect", async () => {
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);

    const req = {
      body: {},
    };

    try {
      await postTransaction({
        events: [
          {
            ...events[0],
            number: currentEventsForRoot + 1,
          },
        ],
        saveEventsFn: saveEventsFnFake,
        reserveRootCountsFn: reserveRootCountsFnFake,
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(412);
    }
  });

  it("should throw correctly", async () => {
    const error = new Error();
    const saveEventsFnFake = fake.returns(writtenEvents);
    const reserveRootCountsFnFake = fake.rejects(error);

    try {
      await postTransaction({
        events,
        saveEventsFn: saveEventsFnFake,
        reserveRootCountsFn: reserveRootCountsFnFake,
      })(transaction);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw with bad topic domain", async () => {
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await postTransaction({
        events: [
          {
            data: {
              topic: `some-action.some-bad-domain.${service}`,
            },
          },
        ],
        reserveRootCountsFn: reserveRootCountsFnFake,
      })(transaction);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This event store can't accept this event."
      );
      expect(e).to.equal(error);
    }
  });
  it("should throw with bad topic service", async () => {
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await postTransaction({
        events: [
          {
            data: {
              topic: `some-action.${domain}.some-bad-service`,
            },
          },
        ],
        reserveRootCountsFn: reserveRootCountsFnFake,
      })(transaction);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This event store can't accept this event."
      );
      expect(e).to.equal(error);
    }
  });
});
