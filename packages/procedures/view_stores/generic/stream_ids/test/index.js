const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, match } = require("sinon");

const streamIds = require("..");

const sort = "some-sort";

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

const id = "some-id";

process.env.CONTEXT = envContext;
process.env.NETWORK = envNetwork;

describe("View store stream", () => {
  beforeEach(() => {
    process.env.DOMAIN = envDomain;
    process.env.SERVICE = envService;
  });
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const streamFake = fake();
    const query = { "some-query-key": 1 };
    const req = {
      query: {
        sort,
        context,
        parallel: 2,
        query,
      },
    };
    const endFake = fake();
    const writeFake = fake();
    const res = {
      end: endFake,
      write: writeFake,
    };
    await streamIds({ streamFn: streamFake })(req, res);
    expect(streamFake).to.have.been.calledWith({
      sort,
      parallel: 2,
      query: {
        "body.some-query-key": 1,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
      fn: match((fn) => {
        const view = { headers: { id } };
        fn(view);
        return writeFake.calledWith(JSON.stringify({ id }));
      }),
    });
    expect(endFake).to.have.been.calledWith();
  });
  it("should call with the correct params with optionals missing, and queryFn", async () => {
    const streamFake = fake();
    const query = { "some-query-key": 1 };
    const req = {
      query: {
        query,
      },
    };
    const endFake = fake();
    const writeFake = fake();
    const res = {
      end: endFake,
      write: writeFake,
    };
    const queryFnFake = fake.returns({ c: 3 });
    await streamIds({ streamFn: streamFake, queryFn: queryFnFake })(req, res);
    expect(queryFnFake).to.have.been.calledWith({ "some-query-key": 1 });
    expect(streamFake).to.have.been.calledWith({
      query: {
        "body.c": 3,
      },
      fn: match((fn) => {
        const view = { headers: { id } };
        fn(view);
        return writeFake.calledWith(JSON.stringify({ id }));
      }),
    });
    expect(endFake).to.have.been.calledWith();
  });
});
