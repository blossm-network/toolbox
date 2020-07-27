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
const network = "some-network";

const topic = `some-topic`;
const nonce = "some-nonce";

const transaction = "some-transaction";

const payload = { a: 1 };
const idempotency = "some-idempotency";
const action = "some-action";
const version = "some-version";
const created = "some-created";
const headers = {
  root,
  topic,
  action,
  domain,
  service,
  network,
  nonce,
  created,
  version,
  idempotency,
};
const txId = "some-tx-id";
const txIp = "some-tx-ip";
const txPath = "some-tx-path";
const txClaims = "some-tx-claims";
const tx = {
  id: txId,
  ip: txIp,
  path: txPath,
  claims: txClaims,
  some: "bogus",
};
const eventData = [
  {
    event: {
      headers,
      context,
      payload,
    },
  },
];
const currentEventsForRoot = 0;
const hash = "some-hash";

const payloadHash = "some-payload-hash";
const contextHash = "some-context-hash";
const txHash = "some-tx-hash";

const reserveRootCount = {
  root,
  value: currentEventsForRoot + eventData.length,
};

process.env.DOMAIN = domain;
process.env.SERVICE = service;
process.env.NETWORK = network;

describe("Event store post", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const saveEventsFnFake = fake();
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);

    const hashFake = stub()
      .onCall(0)
      .returns({ create: () => payloadHash })
      .onCall(1)
      .returns({ create: () => contextHash })
      .onCall(2)
      .returns({ create: () => txHash })
      .onCall(3)
      .returns({ create: () => hash });

    replace(deps, "hash", hashFake);

    const nonceFake = fake.returns(nonce);
    replace(deps, "nonce", nonceFake);

    const result = await postTransaction({
      eventData,
      tx,
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
    })(transaction);

    expect(result).to.deep.equal({
      receipt: [{ topic, created }],
    });

    expect(saveEventsFnFake).to.have.been.calledWith({
      events: [
        {
          headers: {
            root,
            number: currentEventsForRoot,
            topic,
            committed: deps.dateString(),
            nonce,
            action,
            domain,
            service,
            network,
            version,
            created,
            idempotency,
            pHash: payloadHash,
            cHash: contextHash,
            tHash: txHash,
          },
          hash,
          payload,
          context,
          tx: {
            id: txId,
            ip: txIp,
            path: txPath,
            claims: txClaims,
          },
        },
      ],
      transaction,
    });
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
      transaction,
    });
    expect(hashFake.getCall(0)).to.have.been.calledWith(payload);
    expect(hashFake.getCall(1)).to.have.been.calledWith(context);
    expect(hashFake.getCall(2)).to.have.been.calledWith({
      id: txId,
      ip: txIp,
      path: txPath,
      claims: txClaims,
    });
    expect(hashFake.getCall(3)).to.have.been.calledWith({
      root,
      number: currentEventsForRoot,
      topic,
      committed: deps.dateString(),
      nonce,
      action,
      domain,
      service,
      network,
      version,
      created,
      idempotency,
      pHash: payloadHash,
      cHash: contextHash,
      tHash: txHash,
    });
  });
  it("should call with the correct params with correct number", async () => {
    const saveEventsFnFake = fake();
    const number = currentEventsForRoot + 12;
    const reserveRootCount = {
      root,
      value: number + eventData.length,
    };
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const hashFake = stub()
      .onCall(0)
      .returns({
        create: () => payloadHash,
      })
      .onCall(1)
      .returns({
        create: () => contextHash,
      })
      .onCall(2)
      .returns({
        create: () => txHash,
      })
      .onCall(3)
      .returns({
        create: () => hash,
      });
    replace(deps, "hash", hashFake);

    const nonceFake = fake.returns(nonce);
    replace(deps, "nonce", nonceFake);

    const result = await postTransaction({
      eventData: [
        {
          ...eventData[0],
          number,
        },
      ],
      tx,
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
    })(transaction);

    expect(result).to.deep.equal({
      receipt: [{ created, topic }],
    });

    expect(saveEventsFnFake).to.have.been.calledWith({
      events: [
        {
          headers: {
            root,
            number,
            topic,
            committed: deps.dateString(),
            nonce,
            action,
            domain,
            service,
            network,
            version,
            created,
            idempotency,
            pHash: payloadHash,
            cHash: contextHash,
            tHash: txHash,
          },
          hash,
          payload,
          context,
          tx: {
            id: txId,
            ip: txIp,
            path: txPath,
            claims: txClaims,
          },
        },
      ],
      transaction,
    });
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
      transaction,
    });
    expect(hashFake.getCall(0)).to.have.been.calledWith(payload);
    expect(hashFake.getCall(1)).to.have.been.calledWith(context);
    expect(hashFake.getCall(2)).to.have.been.calledWith({
      id: txId,
      ip: txIp,
      path: txPath,
      claims: txClaims,
    });
    expect(hashFake.getCall(3)).to.have.been.calledWith({
      root,
      number,
      topic,
      committed: deps.dateString(),
      nonce,
      action,
      domain,
      service,
      network,
      version,
      created,
      idempotency,
      pHash: payloadHash,
      cHash: contextHash,
      tHash: txHash,
    });
  });
  it("should call with the correct params with no tx, payload, or context", async () => {
    const saveEventsFnFake = fake();
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const hashFake = stub()
      .onCall(0)
      .returns({
        create: () => payloadHash,
      })
      .onCall(1)
      .returns({
        create: () => contextHash,
      })
      .onCall(2)
      .returns({
        create: () => txHash,
      })
      .onCall(3)
      .returns({
        create: () => hash,
      });

    replace(deps, "hash", hashFake);

    const nonceFake = fake.returns(nonce);
    replace(deps, "nonce", nonceFake);

    const result = await postTransaction({
      eventData: [
        {
          event: {
            headers,
          },
        },
      ],
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
    })(transaction);

    expect(result).to.deep.equal({
      receipt: [{ created, topic }],
    });

    expect(saveEventsFnFake).to.have.been.calledWith({
      events: [
        {
          headers: {
            root,
            number: currentEventsForRoot,
            topic,
            committed: deps.dateString(),
            nonce,
            action,
            domain,
            service,
            network,
            version,
            created,
            idempotency,
            pHash: payloadHash,
            cHash: contextHash,
            tHash: txHash,
          },
          hash,
          payload: {},
          context: {},
          tx: { path: [] },
        },
      ],
      transaction,
    });
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
      transaction,
    });
    expect(hashFake.getCall(0)).to.have.been.calledWith({});
    expect(hashFake.getCall(1)).to.have.been.calledWith({});
    expect(hashFake.getCall(2)).to.have.been.calledWith({ path: [] });
    expect(hashFake.getCall(3)).to.have.been.calledWith({
      root,
      number: currentEventsForRoot,
      topic,
      committed: deps.dateString(),
      nonce,
      action,
      domain,
      service,
      network,
      version,
      created,
      idempotency,
      pHash: payloadHash,
      cHash: contextHash,
      tHash: txHash,
    });
  });
  it("should call with the correct params with multiple events with the same root and different roots", async () => {
    const saveEventsFnFake = fake();
    const reserveRootCountsFnFake = stub()
      .onFirstCall()
      .returns({ value: currentEventsForRoot + 2, root })
      .onSecondCall()
      .returns({ value: 10, root: "some-other-root" });

    const hash1 = "some-hash1";
    const hash2 = "some-hash2";
    const hash3 = "some-hash3";
    const payloadHash1 = "some-payload-hash1";
    const payloadHash2 = "some-payload-hash2";
    const payloadHash3 = "some-payload-hash3";
    const contextHash1 = "some-context-hash1";
    const contextHash2 = "some-context-hash2";
    const contextHash3 = "some-context-hash3";
    const txHash1 = "some-tx-hash1";
    const txHash2 = "some-tx-hash2";
    const txHash3 = "some-tx-hash3";

    const hashFake = stub()
      .onCall(0)
      .returns({
        create: () => payloadHash1,
      })
      .onCall(1)
      .returns({
        create: () => contextHash1,
      })
      .onCall(2)
      .returns({
        create: () => txHash1,
      })
      .onCall(3)
      .returns({
        create: () => hash1,
      })
      .onCall(4)
      .returns({
        create: () => payloadHash2,
      })
      .onCall(5)
      .returns({
        create: () => contextHash2,
      })
      .onCall(6)
      .returns({
        create: () => txHash2,
      })
      .onCall(7)
      .returns({
        create: () => hash2,
      })
      .onCall(8)
      .returns({
        create: () => payloadHash3,
      })
      .onCall(9)
      .returns({
        create: () => contextHash3,
      })
      .onCall(10)
      .returns({
        create: () => txHash3,
      })
      .onCall(11)
      .returns({
        create: () => hash3,
      });

    replace(deps, "hash", hashFake);

    const nonce1 = "some-nonce1";
    const nonce2 = "some-nonce2";
    const nonce3 = "some-nonce3";
    const nonce4 = "some-nonce4";

    const nonceFake = stub()
      .onFirstCall()
      .returns(nonce1)
      .onSecondCall()
      .returns(nonce2)
      .onThirdCall()
      .returns(nonce3)
      .onCall(3)
      .returns(nonce4);

    replace(deps, "nonce", nonceFake);

    const result = await postTransaction({
      eventData: [
        ...eventData,
        ...eventData,
        {
          event: {
            headers: {
              ...headers,
              root: "some-other-root",
              idempotency: "some-other-idempotency",
              version: "some-other-version",
            },
            context: "some-other-context",
            payload: "some-other-payload",
          },
        },
      ],
      tx,
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
    })(transaction);

    expect(result).to.deep.equal({
      receipt: [
        { created, topic },
        { created, topic },
        { created, topic },
      ],
    });

    expect(saveEventsFnFake).to.have.been.calledWith({
      events: [
        {
          headers: {
            root,
            number: currentEventsForRoot,
            topic,
            committed: deps.dateString(),
            nonce: nonce1,
            action,
            domain,
            service,
            network,
            version,
            created,
            idempotency,
            pHash: payloadHash1,
            cHash: contextHash1,
            tHash: txHash1,
          },
          hash: hash1,
          payload,
          context,
          tx: {
            id: txId,
            ip: txIp,
            path: txPath,
            claims: txClaims,
          },
        },
        {
          headers: {
            root,
            number: currentEventsForRoot + 1,
            topic,
            committed: deps.dateString(),
            nonce: nonce2,
            action,
            domain,
            service,
            network,
            version,
            created,
            idempotency,
            pHash: payloadHash2,
            cHash: contextHash2,
            tHash: txHash2,
          },
          hash: hash2,
          payload,
          context,
          tx: {
            id: txId,
            ip: txIp,
            path: txPath,
            claims: txClaims,
          },
        },
        {
          headers: {
            root: "some-other-root",
            number: 9,
            topic,
            committed: deps.dateString(),
            nonce: nonce3,
            action,
            domain,
            service,
            network,
            created,
            idempotency: "some-other-idempotency",
            version: "some-other-version",
            pHash: payloadHash3,
            cHash: contextHash3,
            tHash: txHash3,
          },
          hash: hash3,
          payload: "some-other-payload",
          context: "some-other-context",
          tx: {
            id: txId,
            ip: txIp,
            path: txPath,
            claims: txClaims,
          },
        },
      ],
      transaction,
    });
    expect(reserveRootCountsFnFake.getCall(0)).to.have.been.calledWith({
      root,
      amount: 2,
      transaction,
    });
    expect(reserveRootCountsFnFake.getCall(1)).to.have.been.calledWith({
      root: "some-other-root",
      amount: 1,
      transaction,
    });
    expect(reserveRootCountsFnFake).to.have.been.calledTwice;
    expect(hashFake.getCall(3)).to.have.been.calledWith({
      root,
      number: currentEventsForRoot,
      topic,
      committed: deps.dateString(),
      nonce: nonce1,
      action,
      domain,
      service,
      network,
      version,
      created,
      idempotency,
      pHash: payloadHash1,
      cHash: contextHash1,
      tHash: txHash1,
    });
    expect(hashFake.getCall(7)).to.have.been.calledWith({
      root,
      number: currentEventsForRoot + 1,
      topic,
      committed: deps.dateString(),
      nonce: nonce2,
      action,
      domain,
      service,
      network,
      version,
      created,
      idempotency,
      pHash: payloadHash2,
      cHash: contextHash2,
      tHash: txHash2,
    });
    expect(hashFake.getCall(11)).to.have.been.calledWith({
      root: "some-other-root",
      number: 9,
      topic,
      committed: deps.dateString(),
      nonce: nonce3,
      action,
      domain,
      service,
      network,
      created,
      idempotency: "some-other-idempotency",
      version: "some-other-version",
      pHash: payloadHash3,
      cHash: contextHash3,
      tHash: txHash3,
    });
  });
  it("should call with the correct params if transaction is null", async () => {
    const saveEventsFnFake = fake();
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);
    const hashFake = stub()
      .onCall(0)
      .returns({
        create: () => payloadHash,
      })
      .onCall(1)
      .returns({
        create: () => contextHash,
      })
      .onCall(2)
      .returns({
        create: () => txHash,
      })
      .onCall(3)
      .returns({
        create: () => hash,
      });
    replace(deps, "hash", hashFake);

    const nonceFake = fake.returns(nonce);
    replace(deps, "nonce", nonceFake);

    const result = await postTransaction({
      eventData,
      tx,
      saveEventsFn: saveEventsFnFake,
      reserveRootCountsFn: reserveRootCountsFnFake,
    })();

    expect(result).to.deep.equal({
      receipt: [{ created, topic }],
    });

    expect(saveEventsFnFake).to.have.been.calledWith({
      events: [
        {
          headers: {
            root,
            number: currentEventsForRoot,
            topic,
            committed: deps.dateString(),
            created,
            idempotency,
            nonce,
            action,
            domain,
            service,
            network,
            version,
            pHash: payloadHash,
            cHash: contextHash,
            tHash: txHash,
          },
          hash,
          payload,
          context,
          tx: {
            id: txId,
            ip: txIp,
            path: txPath,
            claims: txClaims,
          },
        },
      ],
    });
    expect(reserveRootCountsFnFake).to.have.been.calledWith({
      root,
      amount: 1,
    });
    expect(hashFake.getCall(0)).to.have.been.calledWith(payload);
    expect(hashFake.getCall(1)).to.have.been.calledWith(context);
    expect(hashFake.getCall(2)).to.have.been.calledWith({
      id: txId,
      ip: txIp,
      path: txPath,
      claims: txClaims,
    });
    expect(hashFake.getCall(3)).to.have.been.calledWith({
      root,
      number: currentEventsForRoot,
      topic,
      committed: deps.dateString(),
      nonce,
      action,
      domain,
      service,
      network,
      version,
      created,
      idempotency,
      pHash: payloadHash,
      cHash: contextHash,
      tHash: txHash,
    });
  });
  it("should throw if event number is incorrect", async () => {
    const saveEventsFnFake = fake();
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);

    const req = {
      body: {},
    };

    try {
      await postTransaction({
        eventData: [
          {
            ...eventData[0],
            number: currentEventsForRoot + 1,
          },
        ],
        tx,
        saveEventsFn: saveEventsFnFake,
        reserveRootCountsFn: reserveRootCountsFnFake,
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(412);
    }
  });

  it("should throw correctly", async () => {
    const error = new Error();
    const saveEventsFnFake = fake();
    const reserveRootCountsFnFake = fake.rejects(error);

    try {
      await postTransaction({
        eventData,
        tx,
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
        eventData: [
          {
            event: {
              headers: {
                domain: "bogus",
                service,
                network,
              },
            },
          },
        ],
        tx,
        reserveRootCountsFn: reserveRootCountsFnFake,
      })(transaction);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This event store can't accept this event."
      );
      expect(e).to.equal(error);
    }
  });
  it("should throw with bad service", async () => {
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await postTransaction({
        eventData: [
          {
            event: {
              headers: {
                domain,
                service: "bogus",
                network,
              },
            },
          },
        ],
        tx,
        reserveRootCountsFn: reserveRootCountsFnFake,
      })(transaction);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This event store can't accept this event."
      );
      expect(e).to.equal(error);
    }
  });
  it("should throw with bad network", async () => {
    const reserveRootCountsFnFake = fake.returns(reserveRootCount);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await postTransaction({
        eventData: [
          {
            event: {
              headers: {
                domain,
                service,
                network: "bogus",
              },
            },
          },
        ],
        tx,
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
