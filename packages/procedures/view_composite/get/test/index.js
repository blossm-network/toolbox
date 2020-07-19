const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");

const get = require("..");

const action = "some-action";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";

process.env.ACTION = action;
process.env.DOMAIN = domain;
process.env.SERVICE = service;
process.env.NETWORK = network;

const query = { b: 2 };

describe("Composite get", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const response = "some-response";
    const mainFnFake = fake.returns(response);

    const viewsFnResult = "some-views-fn-result";
    const viewsFnFake = fake.returns(viewsFnResult);

    const req = {
      query: {
        query,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await get({
      mainFn: mainFnFake,
      viewsFn: viewsFnFake,
    })(req, res);

    expect(viewsFnFake).to.have.been.calledWith({});
    expect(mainFnFake).to.have.been.calledWith({
      query,
      viewsFn: viewsFnResult,
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params with context, claims, and token", async () => {
    const response = "some-response";
    const mainFnFake = fake.returns(response);

    const viewsFnResult = "some-views-fn-result";
    const viewsFnFake = fake.returns(viewsFnResult);

    const context = "some-context";
    const claims = "some-claims";
    const token = "some-token";

    const req = {
      query: {
        query,
        context,
        claims,
        token,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await get({
      mainFn: mainFnFake,
      viewsFn: viewsFnFake,
    })(req, res);

    expect(viewsFnFake).to.have.been.calledWith({ context, claims, token });
    expect(mainFnFake).to.have.been.calledWith({
      query,
      context,
      viewsFn: viewsFnResult,
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error-message";
    const mainFnFake = fake.rejects(new Error(errorMessage));
    const viewsFnResult = "some-views-fn-result";
    const viewsFnFake = fake.returns(viewsFnResult);
    const req = {
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
        viewsFn: viewsFnFake,
      })(req, res);

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
