const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, match, replace } = require("sinon");

const stream = require("..");
const deps = require("../deps");

const queryAggregatesFn = "some-query-aggregates-fn";
const readFactFn = "some-read-fact-fn";
const streamFactFn = "some-stream-fact-fn";
const aggregateFn = "some-aggregate-fn";

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
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const aggregateFnFake = fake.returns(aggregateFn);
    const req = {
      params,
      query: {
        query,
      },
    };
    const writeFake = fake.returns(true);
    const writeHeadFake = fake.returns(true);
    const endFake = fake();
    const res = {
      write: writeFake,
      writeHead: writeHeadFake,
      end: endFake,
    };
    await stream({
      mainFn: mainFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      aggregateFn: aggregateFnFake,
      streamFactFn: streamFactFnFake,
      readFactFn: readFactFnFake,
    })(req, res);
    expect(mainFnFake).to.have.been.calledWith({
      query,
      streamFn: match((fn) => {
        const data = { a: 4 };
        fn(data);
        return writeFake.calledWith(JSON.stringify(data));
      }),
      headersFn: match((fn) => {
        const headers = { a: 4 };
        fn(headers);
        return writeHeadFake.calledWith(200, headers);
      }),
      parallel: 100,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      aggregateFn,
    });
    expect(queryAggregatesFnFake).to.have.been.calledWith({});
    expect(readFactFnFake).to.have.been.calledWith({});
    expect(streamFactFnFake).to.have.been.calledWith({});
    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(endFake).to.have.been.calledWith();
  });
  it("should call with the correct params with context and headers", async () => {
    const mainFnFake = fake();
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const aggregateFnFake = fake.returns(aggregateFn);
    const context1 = "some-context1";
    const context2 = "some-context2";
    const context = {
      [context1]: "some",
      [context2]: "some-other",
    };
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
    const writeHeadFake = fake.returns(true);
    const endFake = fake();
    const res = {
      write: writeFake,
      writeHead: writeHeadFake,
      end: endFake,
    };
    await stream({
      mainFn: mainFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      aggregateFn: aggregateFnFake,
      streamFactFn: streamFactFnFake,
      readFactFn: readFactFnFake,
      contexts: [context1, context2],
    })(req, res);
    expect(mainFnFake).to.have.been.calledWith({
      query,
      context,
      root,
      claims,
      streamFn: match((fn) => {
        const data = { a: 4 };
        fn(data);
        return writeFake.calledWith(JSON.stringify(data));
      }),
      headersFn: match((fn) => {
        const data = { a: 4 };
        fn(data);
        return writeHeadFake.calledWith(200, data);
      }),
      parallel,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      aggregateFn,
    });
    expect(queryAggregatesFnFake).to.have.been.calledWith({
      context,
      claims,
      token,
    });
    expect(aggregateFnFake).to.have.been.calledWith({
      context,
      claims,
      token,
    });
    expect(readFactFnFake).to.have.been.calledWith({
      context,
      claims,
      token,
    });
    expect(streamFactFnFake).to.have.been.calledWith({
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
    const readFactFnFake = fake.returns(aggregateFn);
    const streamFactFnFake = fake.returns(readFactFn);
    const aggregateFnFake = fake.returns(aggregateFn);
    const req = {
      params,
      query,
    };
    const res = {};
    try {
      await stream({
        mainFn: mainFnFake,
        queryAggregatesFn: queryAggregatesFnFake,
        aggregateFn: aggregateFnFake,
        readFactFn: readFactFnFake,
        streamFactFn: streamFactFnFake,
      })(req, res);
      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
  it("should redirect correctly with no context", async () => {
    const req = {
      query: {},
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };
    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });
    try {
      await stream({
        contexts: [context],
      })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("This context is forbidden.");
      expect(e).to.equal(error);
    }
  });
  it("should redirect correctly with bad context", async () => {
    const req = {
      query: {
        context: {},
      },
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };
    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });
    try {
      await stream({
        contexts: [context],
      })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("This context is forbidden.");
      expect(e).to.equal(error);
    }
  });
});
