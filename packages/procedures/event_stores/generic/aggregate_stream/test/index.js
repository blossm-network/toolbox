const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, match } = require("sinon");

const streamAggregates = require("..");

const root = "some-root";

const envDomain = "some-env-domain";
const envService = "some-env-service";
const envNetwork = "some-env-network";

const timestamp = "some-timestamp";
const parallel = "some-parallel";

process.env.NETWORK = envNetwork;

describe("Event store stream", () => {
  beforeEach(() => {
    process.env.DOMAIN = envDomain;
    process.env.SERVICE = envService;
  });
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const aggregateStreamFake = fake();

    const params = { root };

    const req = {
      query: {
        timestamp,
        parallel,
      },
      params,
    };

    const endFake = fake();
    const writeFake = fake();
    const res = {
      end: endFake,
      write: writeFake,
    };

    await streamAggregates({ aggregateStreamFn: aggregateStreamFake })(
      req,
      res
    );
    expect(aggregateStreamFake).to.have.been.calledWith({
      timestamp,
      parallel,
      fn: match((fn) => {
        const aggregate = { a: 1 };
        fn(aggregate);
        return writeFake.calledWith(JSON.stringify(aggregate));
      }),
    });
    expect(endFake).to.have.been.calledWith();
  });
  it("should call with the correct params with optionals missing", async () => {
    const aggregateStreamFake = fake();

    const params = { root };

    const req = {
      query: {},
      params,
    };

    const endFake = fake();
    const writeFake = fake();
    const res = {
      end: endFake,
      write: writeFake,
    };

    await streamAggregates({ aggregateStreamFn: aggregateStreamFake })(
      req,
      res
    );
    expect(aggregateStreamFake).to.have.been.calledWith({
      fn: match((fn) => {
        const aggregate = { a: 1 };
        fn(aggregate);
        return writeFake.calledWith(JSON.stringify(aggregate));
      }),
    });
    expect(endFake).to.have.been.calledWith();
  });
});
