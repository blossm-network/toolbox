const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, match } = require("sinon");

const stream = require("..");

const queryAggregatesFn = "some-query-aggregates-fn";
const action = "some-action";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";

process.env.ACTION = action;
process.env.DOMAIN = domain;
process.env.SERVICE = service;
process.env.NETWORK = network;

const params = { a: 1 };
const query = { b: 2 };

describe("Fact stream", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const mainFnFake = fake();
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);

    const req = {
      params,
      query: {
        query,
      },
    };

    const writeFake = fake.returns(true);
    const endFake = fake();

    const res = {
      write: writeFake,
      end: endFake,
    };

    await stream({
      mainFn: mainFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
    })(req, res);

    expect(mainFnFake).to.have.been.calledWith({
      query,
      streamFn: match((fn) => {
        const data = { a: 4 };
        fn(data);
        return writeFake.calledWith(JSON.stringify(data));
      }),
      parallel: 100,
      queryAggregatesFn,
    });
    expect(queryAggregatesFnFake).to.have.been.calledWith({});
    expect(endFake).to.have.been.calledWith();
  });
  it("should call with the correct params with context and headers", async () => {
    const mainFnFake = fake();
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);

    const context = "some-context";
    const claims = "some-claims";
    const token = "some-token";
    const root = "some-root";
    const parallel = "some-parallel";

    const req = {
      params: {
        root,
      },
      query: {
        query,
        context,
        claims,
        token,
        parallel,
      },
    };

    const writeFake = fake.returns(true);
    const endFake = fake();

    const res = {
      write: writeFake,
      end: endFake,
    };

    await stream({
      mainFn: mainFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
    })(req, res);

    expect(mainFnFake).to.have.been.calledWith({
      query,
      context,
      root,
      streamFn: match((fn) => {
        const data = { a: 4 };
        fn(data);
        return writeFake.calledWith(JSON.stringify(data));
      }),
      parallel,
      queryAggregatesFn,
    });
    expect(queryAggregatesFnFake).to.have.been.calledWith({
      context,
      claims,
      token,
    });
    expect(endFake).to.have.been.calledWith();
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error-message";
    const mainFnFake = fake.rejects(new Error(errorMessage));
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const req = {
      params,
      query,
    };

    const res = {};

    try {
      await stream({
        mainFn: mainFnFake,
        queryAggregatesFn: queryAggregatesFnFake,
      })(req, res);

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
