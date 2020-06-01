const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match } = require("sinon");

const deps = require("../deps");
const get = require("..");

const results = "some-result";
const query = "some-query";
const name = "some-name";
const domain = "some-domain";
const context = "some-context";
const claims = "some-claims";

const internalTokenFn = "some-internal-token-fn";
const key = "some-key";
const externalTokenNetwork = "some-external-token-network";
const externalTokenKey = "some-external-token-key";

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

    const externalTokenResult = "some-external-token-result";
    const externalTokenFnFake = fake.returns(externalTokenResult);
    await get({
      name,
      domain,
      internalTokenFn,
      externalTokenFn: externalTokenFnFake,
      key,
    })(req, res);

    expect(factFake).to.have.been.calledWith({
      name,
      domain,
    });
    expect(setFake).to.have.been.calledWith({
      context,
      claims,
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn({
            network: externalTokenNetwork,
            key: externalTokenKey,
          });
          return (
            result == externalTokenResult &&
            externalTokenFnFake.calledWith({
              network: externalTokenNetwork,
              key: externalTokenKey,
            })
          );
        }),
        key,
      },
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith(results);
    expect(setResponseFake).to.have.been.calledWith({});
  });
  it("should call with the correct params when headers are passed back and token in req", async () => {
    const headers = "some-headers";
    const readFake = fake.returns({ body: results, headers });
    const setFake = fake.returns({
      read: readFake,
    });
    const factFake = fake.returns({
      set: setFake,
    });
    replace(deps, "fact", factFake);

    const reqToken = "some-req-token";
    const req = {
      context,
      claims,
      query,
      token: reqToken,
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

    const externalTokenFnFake = fake();
    await get({
      name,
      domain,
      internalTokenFn,
      externalTokenFn: externalTokenFnFake,
      key,
    })(req, res);
    expect(externalTokenFnFake).to.not.have.been.called;

    expect(factFake).to.have.been.calledWith({
      name,
      domain,
    });
    expect(setFake).to.have.been.calledWith({
      context,
      claims,
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn();
          return result == reqToken;
        }),
        key,
      },
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
