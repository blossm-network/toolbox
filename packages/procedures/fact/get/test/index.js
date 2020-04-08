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

const params = { a: 1 };
const query = { b: 2 };

describe("Fact get", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const response = "some-response";
    const mainFnFake = fake.returns(response);

    const req = {
      params,
      query: {
        query
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await get({
      mainFn: mainFnFake
    })(req, res);

    expect(mainFnFake).to.have.been.calledWith({
      query
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params with context and claims", async () => {
    const response = "some-response";
    const mainFnFake = fake.returns(response);

    const claims = "some-claims";
    const context = "some-context";
    const root = "some-root";

    const req = {
      params: {
        root
      },
      query: {
        query,
        claims,
        context
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await get({
      mainFn: mainFnFake
    })(req, res);

    expect(mainFnFake).to.have.been.calledWith({
      query,
      context,
      root,
      claims
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error-message";
    const mainFnFake = fake.rejects(new Error(errorMessage));
    const req = {
      params,
      query
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    try {
      await get({
        mainFn: mainFnFake
      })(req, res);

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
