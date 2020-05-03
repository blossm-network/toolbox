const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const get = require("..");

const results = "some-result";
const query = "some-query";
const name = "some-name";
const domain = "some-domain";
const context = "some-context";
const claims = "some-claims";

const internalTokenFn = "some-internal-token-fn";
const externalTokenFn = "some-external-token-fn";

describe("Fact gateway get", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params when action and domain passed in url", async () => {
    const readFake = fake.returns({ body: results });
    const setFake = fake.returns({
      read: readFake,
    });
    const factFake = fake.returns({
      set: setFake,
    });
    replace(deps, "fact", factFake);

    const req = {
      context,
      claims,
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    await get({ name, domain, internalTokenFn, externalTokenFn })(req, res);

    expect(factFake).to.have.been.calledWith({
      name,
      domain,
    });
    expect(setFake).to.have.been.calledWith({
      context,
      claims,
      tokenFns: { internal: internalTokenFn, external: externalTokenFn },
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith(results);
    expect(setResponseFake).to.have.been.calledWith({});
  });
  it("should call with the correct params when headers are passed back", async () => {
    const headers = "some-headers";
    const readFake = fake.returns({ body: results, headers });
    const setFake = fake.returns({
      read: readFake,
    });
    const factFake = fake.returns({
      set: setFake,
    });
    replace(deps, "fact", factFake);

    const req = {
      context,
      claims,
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    await get({ name, domain, internalTokenFn, externalTokenFn })(req, res);

    expect(factFake).to.have.been.calledWith({
      name,
      domain,
    });
    expect(setFake).to.have.been.calledWith({
      context,
      claims,
      tokenFns: { internal: internalTokenFn, external: externalTokenFn },
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith(results);
    expect(setResponseFake).to.have.been.calledWith(headers);
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const readFake = fake.rejects(new Error(errorMessage));
    const setFake = fake.returns({
      read: readFake,
    });
    const factFake = fake.returns({
      set: setFake,
    });
    replace(deps, "fact", factFake);

    const req = {
      context,
      query,
    };

    const res = {};

    try {
      await get({ name, domain })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
