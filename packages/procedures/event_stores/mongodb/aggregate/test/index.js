const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const aggregate = require("..");

const deps = require("../deps");

const root = "some-root";
const action = "some-action";
const eventHash = "some-event-hash";
const eventNonce = "some-event-nonce";
const eventTrace = "some-event-trace";

const aRoot = "some-a-root";
const aService = "some-a-service";
const aNetwork = "some-a-network";
const bRoot = "some-b-root";
const bService = "some-b-service";
const bNetwork = "some-b-network";

const event = {
  hash: eventHash,
  headers: {
    nonce: eventNonce,
    root,
    number: 1,
    action,
  },
  scenario: {
    trace: eventTrace,
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

const trace = "some-trace";
const snapshotHash = "some-snapshot-hash";

const findOneResult = {
  hash: snapshotHash,
  headers: {
    root,
    state: { a: 1, b: 1 },
    lastEventNumber: 6,
    trace: [trace],
  },
  context: {
    a: {
      root: aRoot,
      service: aService,
      network: aNetwork,
    },
    c: "some-c",
  },
};

const eventStore = "some-event-store";
const snapshotStore = "some-snapshot-store";

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
    const eachAsyncFake = fake.yields(event);
    const cursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const findFake = fake.returns({
      cursor: cursorFake,
    });
    const findOneFake = fake.returns(findOneResult);

    const db = {
      find: findFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await aggregate({ handlers, eventStore, snapshotStore })(
      root
    );

    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "headers.root": root,
        "headers.number": { $gt: 6 },
      },
      sort: {
        "headers.number": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(eachAsyncFake).to.have.been.calledOnce;
    expect(findOneFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.created": -1,
      },
      select: {
        events: 0,
      },
      options: {
        lean: true,
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
        trace: [eventTrace, trace],
      },
      state: { a: 1, b: 2, c: 2 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        c: "some-c",
      },
    });
  });
  it("should call with the correct params if includeEvents and theres a timestamp", async () => {
    const eachAsyncFake = fake.yields(event);
    const cursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const findFake = fake.returns({
      cursor: cursorFake,
    });
    const findOneFake = fake.returns(findOneResult);

    const db = {
      find: findFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const timestamp = "some-timestamp";
    const result = await aggregate({
      handlers,
      eventStore,
      snapshotStore,
    })(root, { includeEvents: true, timestamp });

    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "headers.root": root,
        "headers.number": { $gt: 6 },
        "headers.created": { $lte: timestamp },
      },
      sort: {
        "headers.number": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(eachAsyncFake).to.have.been.calledOnce;
    expect(findOneFake).to.have.been.calledWith({
      store: snapshotStore,
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
      options: {
        lean: true,
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
        trace: [eventTrace, trace],
      },
      state: { a: 1, b: 2, c: 2 },
      context: {
        a: {
          root: aRoot,
          service: aService,
          network: aNetwork,
        },
        c: "some-c",
      },
      events: [event],
    });
  });
  it("should call with the correct params with no events", async () => {
    const eachAsyncFake = fake();
    const otherCursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const findFake = fake.returns({
      cursor: otherCursorFake,
    });
    const findOneFake = fake.returns(findOneResult);

    const db = {
      find: findFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await aggregate({ handlers, eventStore, snapshotStore })(
      root
    );

    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "headers.root": root,
        "headers.number": { $gt: 6 },
      },
      sort: {
        "headers.number": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(eachAsyncFake).to.have.been.calledOnce;
    expect(findOneFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.created": -1,
      },
      select: {
        events: 0,
      },
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal({
      headers: {
        lastEventNumber: 6,
        domain: envDomain,
        service: envService,
        network: envNetwork,
        trace: [trace],
        root,
        snapshotHash,
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
    });
  });
  it("should call with the correct params with no snapshot found", async () => {
    const eachAsyncFake = fake.yields(event);
    const cursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const findFake = fake.returns({
      cursor: cursorFake,
    });
    const findOneFake = fake();

    const db = {
      find: findFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await aggregate({ handlers, eventStore, snapshotStore })(
      root
    );

    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.number": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(eachAsyncFake).to.have.been.calledOnce;
    expect(findOneFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.created": -1,
      },
      select: {
        events: 0,
      },
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal({
      headers: {
        root,
        lastEventNumber: 1,
        trace: [eventTrace],
        domain: envDomain,
        service: envService,
        network: envNetwork,
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
    });
  });
  it("should call with the correct params with no snapshot or events found", async () => {
    const eachAsyncFake = fake();
    const otherCursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const findFake = fake.returns({
      cursor: otherCursorFake,
    });
    const findOneFake = fake.returns();

    const db = {
      find: findFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await aggregate({ handlers, eventStore, snapshotStore })(
      root
    );

    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.number": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(findOneFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        "headers.root": root,
      },
      sort: {
        "headers.created": -1,
      },
      select: {
        events: 0,
      },
      options: {
        lean: true,
      },
    });
    expect(result).to.be.undefined;
  });
  it("should throw if a handler isn't specified", async () => {
    const eachAsyncFake = fake.yields(event);
    const cursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const findFake = fake.returns({
      cursor: cursorFake,
    });
    const findOneFake = fake.returns(findOneResult);

    const db = {
      find: findFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await aggregate({ handlers: {}, eventStore, snapshotStore })(root);
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
