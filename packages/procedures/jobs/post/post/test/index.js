const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");

const post = require("..");

const payload = "some-payload";

const action = "some-action";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";

process.env.ACTION = action;
process.env.DOMAIN = domain;
process.env.SERVICE = service;
process.env.NETWORK = network;

describe("Post job post", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const mainFnFake = fake();

    const req = {
      body: {
        payload
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await post({
      mainFn: mainFnFake
    })(req, res);

    expect(mainFnFake).to.have.been.calledWith({
      payload
    });
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledWith();
  });
  it("should call with the correct params with context and claims", async () => {
    const mainFnFake = fake();

    const claims = "some-claims";
    const context = "some-context";

    const req = {
      body: {
        payload,
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

    await post({
      mainFn: mainFnFake
    })(req, res);

    expect(mainFnFake).to.have.been.calledWith({
      payload,
      context,
      claims
    });
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledWith();
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error-message";
    const mainFnFake = fake.rejects(new Error(errorMessage));
    const req = {
      body: {
        payload
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    try {
      await post({
        mainFn: mainFnFake
      })(req, res);

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
