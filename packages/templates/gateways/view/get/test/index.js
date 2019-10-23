const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const get = require("..");

const results = "some-result";
const query = "some-query";
const service = "some-service";
const network = "some-network";
const name = "some-name";
const domain = "some-domain";

process.env.SERVICE = service;
process.env.NETWORK = network;

describe("View gateway get", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params when action and domain passed in url", async () => {
    const readFake = fake.returns(results);
    const setFake = fake.returns({
      read: readFake
    });
    const viewStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "viewStore", viewStoreFake);

    const req = {
      context,
      query,
      params: {
        name,
        domain
      }
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    await get()(req, res);

    expect(viewStoreFake).to.have.been.calledWith({
      name,
      domain,
      service,
      network
    });
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith(results);
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const readFake = fake.throws(new Error(errorMessage));
    const setFake = fake.returns({
      read: readFake
    });
    const viewStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "viewStore", viewStoreFake);

    const req = {
      context,
      query,
      params: {
        name,
        domain
      }
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    try {
      await get()(req, res);
      //shouldn't be called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
