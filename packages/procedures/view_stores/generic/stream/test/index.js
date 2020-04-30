const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, match } = require("sinon");

const stream = require("..");

const obj = { a: "some-obj" };
const sort = "some-sort";
const root = "some-root";
const objRoot = "some-obj-root";

const envContext = "some-env-context";
const envContextRoot = "some-env-context-root";
const envContextService = "some-env-context-service";
const envContextNetwork = "some-env-context-network";

const envDomain = "some-env-domain";
const envService = "some-env-service";
const envNetwork = "some-env-network";

const context = {
  [envContext]: {
    root: envContextRoot,
    service: envContextService,
    network: envContextNetwork,
  },
};

process.env.CONTEXT = envContext;
process.env.NETWORK = envNetwork;

describe("View store get", () => {
  beforeEach(() => {
    process.env.DOMAIN = envDomain;
    process.env.SERVICE = envService;
  });
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const streamFake = fake();

    const params = { root };

    const query = { "some-query-key": 1 };

    const req = {
      query: {
        sort,
        context,
        parallel: 2,
        query,
      },
      params,
    };

    const endFake = fake();
    const writeResult = "some-write-result";
    const writeFake = fake.returns(writeResult);
    const res = {
      end: endFake,
      write: writeFake,
    };

    await stream({ streamFn: streamFake })(req, res);
    expect(streamFake).to.have.been.calledWith({
      sort,
      parallel: 2,
      query: {
        "body.some-query-key": 1,
        "headers.some-env-context": {
          root: envContextRoot,
          service: envContextService,
          network: envContextNetwork,
        },
        "headers.some-env-domain": {
          root,
          service: envService,
          network: envNetwork,
        },
      },
      fn: match((fn) => {
        const view = { body: obj, headers: { root: objRoot } };
        const result = fn(view);
        return (
          result == writeResult &&
          writeFake.calledWith(JSON.stringify({ ...obj, root: objRoot }))
        );
      }),
    });
    expect(endFake).to.have.been.calledWith();
  });
  it("should call with the correct params with no query", async () => {
    const streamFake = fake();

    const params = { root };

    const req = {
      query: {
        context,
        parallel: 2,
      },
      params,
    };

    const endFake = fake();
    const writeResult = "some-write-result";
    const writeFake = fake.returns(writeResult);
    const res = {
      end: endFake,
      write: writeFake,
    };

    await stream({ streamFn: streamFake })(req, res);
    expect(streamFake).to.have.been.calledWith({
      parallel: 2,
      query: {
        "headers.some-env-context": {
          root: envContextRoot,
          service: envContextService,
          network: envContextNetwork,
        },
        "headers.some-env-domain": {
          root,
          service: envService,
          network: envNetwork,
        },
      },
      fn: match((fn) => {
        const view = { body: obj, headers: { root: objRoot } };
        const result = fn(view);
        return (
          result == writeResult &&
          writeFake.calledWith(JSON.stringify({ ...obj, root: objRoot }))
        );
      }),
    });
    expect(endFake).to.have.been.calledWith();
  });
  it("should call with the correct params with no env domain", async () => {
    const streamFake = fake();

    const query = { "some-query-key": 1 };

    const req = {
      query: {
        sort,
        context,
        query,
      },
      params: {},
    };

    const endFake = fake();
    const writeResult = "some-write-result";
    const writeFake = fake.returns(writeResult);
    const res = {
      end: endFake,
      write: writeFake,
    };

    const otherQuery = { "some-other-query-key": 1 };
    const queryFnFake = fake.returns(otherQuery);
    delete process.env.DOMAIN;

    await stream({ streamFn: streamFake, queryFn: queryFnFake })(req, res);
    expect(queryFnFake).to.have.been.calledWith(query);
    expect(streamFake).to.have.been.calledWith({
      sort,
      query: {
        "body.some-other-query-key": 1,
        "headers.some-env-context": {
          root: envContextRoot,
          service: envContextService,
          network: envContextNetwork,
        },
      },
      fn: match((fn) => {
        const view = { body: obj, headers: { root: objRoot } };
        const result = fn(view);
        return (
          result == writeResult &&
          writeFake.calledWith(JSON.stringify({ ...obj, root: objRoot }))
        );
      }),
    });
    expect(endFake).to.have.been.calledWith();
  });
  it("should call with the correct params with no env service", async () => {
    const streamFake = fake();

    const params = { root };

    const query = { "some-query-key": 1 };

    const req = {
      query: {
        sort,
        context,
        query,
      },
      params,
    };

    const endFake = fake();
    const writeResult = "some-write-result";
    const writeFake = fake.returns(writeResult);
    const res = {
      end: endFake,
      write: writeFake,
    };
    delete process.env.SERVICE;
    await stream({ streamFn: streamFake })(req, res);
    expect(streamFake).to.have.been.calledWith({
      sort,
      query: {
        "body.some-query-key": 1,
        "headers.some-env-context": {
          root: envContextRoot,
          service: envContextService,
          network: envContextNetwork,
        },
      },
      fn: match((fn) => {
        const view = { body: obj, headers: { root: objRoot } };
        const result = fn(view);
        return (
          result == writeResult &&
          writeFake.calledWith(JSON.stringify({ ...obj, root: objRoot }))
        );
      }),
    });
    expect(endFake).to.have.been.calledWith();
  });
});
