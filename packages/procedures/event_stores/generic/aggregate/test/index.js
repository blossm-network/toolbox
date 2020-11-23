const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, stub, match } = require("sinon");
const aggregate = require("..");

const deps = require("../deps");

const root = "some-root";
const action = "some-action";
const eventHash = "some-event-hash";
const eventNonce = "some-event-nonce";
const eventTxId = "some-event-txid";

const aRoot = "some-a-root";
const aService = "some-a-service";
const aNetwork = "some-a-network";
const bRoot = "some-b-root";
const bService = "some-b-service";
const bNetwork = "some-b-network";

const snapshotCreated = "some-snapshot-created";
const eventCreated = "some-event-created";

const event = {
  hash: eventHash,
  headers: {
    nonce: eventNonce,
    root,
    number: 1,
    action,
    created: eventCreated,
  },
  tx: {
    id: eventTxId,
  },
  context: {
    a: {
      root: aRoot,
      service: aService,
      network: aNetwork,
    },
    b: {
      root: bRoot,
      service: bService,
      network: bNetwork,
    },
    c: "some-c",
  },
  payload: { b: 2, c: 2 },
};

const handlers = {
  [action]: (state, payload) => {
    return {
      ...state,
      ...payload,
    };
  },
};

const txId = "some-txid";
const snapshotHash = "some-snapshot-hash";

const envDomain = "some-env-domain";
const envService = "some-env-service";
const envNetwork = "some-env-network";

process.env.DOMAIN = envDomain;
process.env.SERVICE = envService;
process.env.NETWORK = envNetwork;

describe("Mongodb event store aggregate", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const findOneResult = {
      hash: snapshotHash,
      headers: {
        root,
        lastEventNumber: 6,
        number: 23,
        nonce: "some-nonce",
        created: snapshotCreated,
      },
      state: { a: 1, b: 1 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        c: "some-c",
      },
      txIds: [txId],
    };
    const eventStreamFnFake = stub().yieldsTo("fn", event);
    const findOneSnapshotFnFake = fake.returns({
      ...findOneResult,
      txIds: [eventTxId],
    });

    const result = await aggregate({
      handlers,
      eventStreamFn: eventStreamFnFake,
      findOneSnapshotFn: findOneSnapshotFnFake,
    })(root);

    expect(eventStreamFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
        "headers.number": { $gt: 6 },
      },
      sort: {
        "headers.number": 1,
      },
      fn: match(() => true),
    });
    expect(findOneSnapshotFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.created": -1,
      },
      select: {
        events: 0,
      },
    });
    expect(result).to.deep.equal({
      headers: {
        root,
        snapshotHash,
        domain: envDomain,
        service: envService,
        network: envNetwork,
        lastEventNumber: 1,
        number: 23,
        nonce: "some-nonce",
        timestamp: eventCreated,
      },
      state: { a: 1, b: 2, c: 2 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        b: {
          root: bRoot,
          service: bService,
          network: bNetwork,
        },
        c: "some-c",
      },
      groups: [],
      txIds: [eventTxId],
    });
  });
  it("should call with the correct params with group adding", async () => {
    const findOneResult = {
      hash: snapshotHash,
      headers: {
        root,
        lastEventNumber: 6,
        number: 23,
        nonce: "some-nonce",
        created: snapshotCreated,
      },
      state: { a: 1, b: 1 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        c: "some-c",
      },
      txIds: [txId],
    };
    const eventStreamFnFake = stub().yieldsTo("fn", {
      ...event,
      groupsAdded: ["some-added-group"],
    });
    const findOneSnapshotFnFake = fake.returns({
      ...findOneResult,
      groups: ["some-group"],
    });

    const result = await aggregate({
      handlers,
      eventStreamFn: eventStreamFnFake,
      findOneSnapshotFn: findOneSnapshotFnFake,
    })(root);

    expect(eventStreamFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
        "headers.number": { $gt: 6 },
      },
      sort: {
        "headers.number": 1,
      },
      fn: match(() => true),
    });
    expect(findOneSnapshotFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.created": -1,
      },
      select: {
        events: 0,
      },
    });
    expect(result).to.deep.equal({
      headers: {
        root,
        snapshotHash,
        domain: envDomain,
        service: envService,
        network: envNetwork,
        lastEventNumber: 1,
        number: 23,
        nonce: "some-nonce",
        timestamp: eventCreated,
      },
      state: { a: 1, b: 2, c: 2 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        b: {
          root: bRoot,
          service: bService,
          network: bNetwork,
        },
        c: "some-c",
      },
      groups: ["some-group", "some-added-group"],
      txIds: [eventTxId, txId],
    });
  });
  it("should call with the correct params with group removing and ignored context", async () => {
    const findOneResult = {
      hash: snapshotHash,
      headers: {
        root,
        lastEventNumber: 6,
        number: 23,
        nonce: "some-nonce",
        created: snapshotCreated,
      },
      state: { a: 1, b: 1 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        c: "some-c",
      },
      txIds: [txId],
    };
    const eventStreamFnFake = stub().yieldsTo("fn", {
      ...event,
      groupsRemoved: [
        {
          root: "some-removed-group-root",
          service: "some-removed-group-service",
          network: "some-removed-group-network",
        },
      ],
      context: {
        a: {
          root: "some-root",
          service: "some-service",
          network: "some-network",
        },
        b: {
          root: bRoot,
          service: bService,
          network: bNetwork,
        },
        c: "some-wrong-c",
      },
    });
    const findOneSnapshotFnFake = fake.returns({
      ...findOneResult,
      groups: [
        {
          root: "some-group-root",
          service: "some-group-service",
          network: "some-group-network",
        },
        {
          root: "some-removed-group-root",
          service: "some-removed-group-service",
          network: "some-removed-group-network",
        },
      ],
    });

    const result = await aggregate({
      handlers,
      eventStreamFn: eventStreamFnFake,
      findOneSnapshotFn: findOneSnapshotFnFake,
    })(root);

    expect(eventStreamFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
        "headers.number": { $gt: 6 },
      },
      sort: {
        "headers.number": 1,
      },
      fn: match(() => true),
    });
    expect(findOneSnapshotFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.created": -1,
      },
      select: {
        events: 0,
      },
    });
    expect(result).to.deep.equal({
      headers: {
        root,
        snapshotHash,
        domain: envDomain,
        service: envService,
        network: envNetwork,
        lastEventNumber: 1,
        number: 23,
        nonce: "some-nonce",
        timestamp: eventCreated,
      },
      state: { a: 1, b: 2, c: 2 },
      context: {
        a: false,
        b: {
          root: bRoot,
          service: bService,
          network: bNetwork,
        },
        c: false,
      },
      groups: [
        {
          root: "some-group-root",
          service: "some-group-service",
          network: "some-group-network",
        },
      ],
      txIds: [eventTxId, txId],
    });
  });
  it("should call with the correct params if includeEvents and theres a timestamp and eventLimit ", async () => {
    const findOneResult = {
      hash: snapshotHash,
      headers: {
        root,
        lastEventNumber: 6,
        number: 23,
        nonce: "some-nonce",
        created: snapshotCreated,
      },
      state: { a: 1, b: 1 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        c: "some-c",
      },
      txIds: [txId],
    };
    const eventStreamFnFake = stub().yieldsTo("fn", event);
    const findOneSnapshotFnFake = fake.returns(findOneResult);

    const timestamp = "some-timestamp";
    const eventLimit = "some-event-limit";

    const result = await aggregate({
      handlers,
      eventStreamFn: eventStreamFnFake,
      findOneSnapshotFn: findOneSnapshotFnFake,
    })(root, { includeEvents: true, eventLimit, timestamp });

    expect(eventStreamFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
        "headers.number": { $gt: 6 },
        "headers.created": { $lte: timestamp },
      },
      sort: {
        "headers.number": 1,
      },
      limit: eventLimit,
      fn: match(() => true),
    });
    expect(findOneSnapshotFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
        "headers.created": { $lte: timestamp },
      },
      sort: {
        "headers.created": -1,
      },
      select: {
        events: 0,
      },
    });
    expect(result).to.deep.equal({
      headers: {
        root,
        snapshotHash,
        domain: envDomain,
        service: envService,
        network: envNetwork,
        lastEventNumber: 1,
        number: 23,
        nonce: "some-nonce",
        timestamp: eventCreated,
      },
      state: { a: 1, b: 2, c: 2 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        b: {
          root: bRoot,
          service: bService,
          network: bNetwork,
        },
        c: "some-c",
      },
      events: [event],
      groups: [],
      txIds: [eventTxId, txId],
    });
  });
  it("should call with the correct params with no events", async () => {
    const findOneResult = {
      hash: snapshotHash,
      headers: {
        root,
        lastEventNumber: 6,
        number: 23,
        nonce: "some-nonce",
        created: snapshotCreated,
      },
      state: { a: 1, b: 1 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        c: "some-c",
      },
      txIds: [txId],
    };
    const eventStreamFnFake = fake();
    const findOneSnapshotFnFake = fake.returns(findOneResult);

    const result = await aggregate({
      handlers,
      eventStreamFn: eventStreamFnFake,
      findOneSnapshotFn: findOneSnapshotFnFake,
    })(root);

    expect(eventStreamFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
        "headers.number": { $gt: 6 },
      },
      sort: {
        "headers.number": 1,
      },
      fn: match(() => true),
    });
    expect(findOneSnapshotFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.created": -1,
      },
      select: {
        events: 0,
      },
    });
    expect(result).to.deep.equal({
      headers: {
        lastEventNumber: 6,
        number: 23,
        nonce: "some-nonce",
        domain: envDomain,
        service: envService,
        network: envNetwork,
        root,
        snapshotHash,
        timestamp: snapshotCreated,
      },
      state: { a: 1, b: 1 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        c: "some-c",
      },
      groups: [],
      txIds: [txId],
    });
  });
  it("should call with the correct params with no snapshot found", async () => {
    const eventStreamFnFake = stub().yieldsTo("fn", event);
    const findOneSnapshotFnFake = fake.returns();

    const result = await aggregate({
      handlers,
      eventStreamFn: eventStreamFnFake,
      findOneSnapshotFn: findOneSnapshotFnFake,
    })(root);

    expect(eventStreamFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.number": 1,
      },
      fn: match(() => true),
    });
    expect(findOneSnapshotFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.created": -1,
      },
      select: {
        events: 0,
      },
    });
    expect(result).to.deep.equal({
      headers: {
        root,
        lastEventNumber: 1,
        domain: envDomain,
        service: envService,
        network: envNetwork,
        timestamp: eventCreated,
      },
      state: { b: 2, c: 2 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        b: {
          root: bRoot,
          service: bService,
          network: bNetwork,
        },
        c: "some-c",
      },
      groups: [],
      txIds: [eventTxId],
    });
  });
  it("should call with the correct params with no snapshot or events found", async () => {
    const eventStreamFnFake = fake();
    const findOneSnapshotFnFake = fake();

    const result = await aggregate({
      handlers,
      eventStreamFn: eventStreamFnFake,
      findOneSnapshotFn: findOneSnapshotFnFake,
    })(root);

    expect(eventStreamFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.number": 1,
      },
      fn: match(() => true),
    });
    expect(findOneSnapshotFnFake).to.have.been.calledWith({
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.created": -1,
      },
      select: {
        events: 0,
      },
    });
    expect(result).to.be.undefined;
  });
  it("should throw if a handler isn't specified", async () => {
    const findOneResult = {
      hash: snapshotHash,
      headers: {
        root,
        lastEventNumber: 6,
        number: 23,
        created: snapshotCreated,
      },
      state: { a: 1, b: 1 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        c: "some-c",
      },
      txIds: [txId],
    };
    const eventStreamFnFake = stub().yieldsTo("fn", event);
    const findOneSnapshotFnFake = fake.returns(findOneResult);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await aggregate({
        handlers: {},
        eventStreamFn: eventStreamFnFake,
        findOneSnapshotFn: findOneSnapshotFnFake,
      })(root);

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "Event handler not specified.",
        {
          info: {
            action,
          },
        }
      );
      expect(e).to.equal(error);
    }
  });
});
