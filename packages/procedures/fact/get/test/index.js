const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");

const get = require("..");
const deps = require("../deps");

const queryAggregatesFn = "some-query-aggregates-fn";
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

describe("Fact get", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const response = "some-response";
    const mainFnFake = fake.returns({ response });
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const aggregateFnFake = fake.returns(aggregateFn);

    const req = {
      params,
      query: {
        query,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setFake,
    };

    await get({
      mainFn: mainFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      aggregateFn: aggregateFnFake,
    })(req, res);

    expect(mainFnFake).to.have.been.calledWith({
      query,
      queryAggregatesFn,
      aggregateFn,
    });
    expect(queryAggregatesFnFake).to.have.been.calledWith({});
    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(setFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params with context and headers", async () => {
    const response = "some-response";
    const headers = "some-headers";
    const mainFnFake = fake.returns({ headers, response });
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
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

    const req = {
      params: {
        root,
      },
      query: {
        context,
        claims,
        token,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setFake,
    };

    await get({
      mainFn: mainFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      aggregateFn: aggregateFnFake,
      contexts: [context1, context2],
      claims,
    })(req, res);

    expect(mainFnFake).to.have.been.calledWith({
      query: {},
      context,
      claims,
      root,
      queryAggregatesFn,
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
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
    expect(setFake).to.have.been.calledWith(headers);
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error-message";
    const mainFnFake = fake.rejects(new Error(errorMessage));
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const aggregateFnFake = fake.returns(aggregateFn);

    const req = {
      params,
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    try {
      await get({
        mainFn: mainFnFake,
        queryAggregatesFn: queryAggregatesFnFake,
        aggregateFn: aggregateFnFake,
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
      await get({
        contexts: [context],
      })(req, res);
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
      await get({
        contexts: [context],
      })(req, res);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("This context is forbidden.");
      expect(e).to.equal(error);
    }
  });
});
