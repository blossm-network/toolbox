const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, match } = require("sinon");

const stream = require("..");

const root = "some-root";

const envDomain = "some-env-domain";
const envService = "some-env-service";
const envNetwork = "some-env-network";

const from = "some-from";

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
    const streamFake = fake();

    const params = { root };

    const req = {
      query: {
        from,
        parallel: 2,
      },
      params,
    };

    const endFake = fake();
    const writeFake = fake();
    // const flushFake = fake();
    const res = {
      end: endFake,
      write: writeFake,
      // flush: flushFake,
    };

    await stream({ streamFn: streamFake })(req, res);
    expect(streamFake).to.have.been.calledWith({
      root,
      from,
      parallel: 2,
      fn: match((fn) => {
        const event = { a: 1 };
        fn(event);
        return writeFake.calledWith(JSON.stringify(event));
      }),
    });
    expect(endFake).to.have.been.calledWith();
    // expect(flushFake).to.have.been.calledWith();
  });
  it("should call with the correct params and optionals missing", async () => {
    const streamFake = fake();

    const params = { root };

    const req = {
      query: {
        from,
      },
      params,
    };

    const endFake = fake();
    const writeFake = fake();
    // const flushFake = fake();
    const res = {
      end: endFake,
      write: writeFake,
      // flush: flushFake,
    };

    await stream({ streamFn: streamFake })(req, res);
    expect(streamFake).to.have.been.calledWith({
      root,
      from,
      fn: match((fn) => {
        const event = { a: 1 };
        fn(event);
        return writeFake.calledWith(JSON.stringify(event));
      }),
    });
    expect(endFake).to.have.been.calledWith();
    // expect(flushFake).to.have.been.calledWith();
  });
});
