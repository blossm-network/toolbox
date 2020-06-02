const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match } = require("sinon");

const deps = require("../deps");
const post = require("..");

const response = { a: 1 };
const payload = "some-payload";
const headers = "some-headers";
const name = "some-name";
const domain = "some-domain";
const context = "some-context";
const claims = "some-claims";
const internalTokenFn = "some-internal-token-fn";
const statusCode = "some-status-code";
const key = "some-key";
const externalTokenNetwork = "some-external-token-network";
const externalTokenKey = "some-external-token-key";

const root = "some-root";

const body = {
  payload,
  headers,
  root,
};

process.env.NODE_ENV = "some-node-env-not-dev";

describe("Command gateway post", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const validateFake = fake();
    replace(deps, "validate", validateFake);

    const issueFake = fake.returns({
      body: {
        ...response,
        tokens: [{ a: 1 }],
      },
      statusCode,
    });
    const setFake = fake.returns({
      issue: issueFake,
    });
    const commandFake = fake.returns({
      set: setFake,
    });
    replace(deps, "command", commandFake);

    const req = {
      context,
      claims,
      body,
      params: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const cookieFake = fake();
    const res = {
      cookie: cookieFake,
      set: setResponseFake,
    };
    const externalTokenResult = "some-external-token-result";
    const externalTokenFnFake = fake.returns(externalTokenResult);
    await post({
      name,
      domain,
      internalTokenFn,
      externalTokenFn: externalTokenFnFake,
      key,
    })(req, res);

    expect(validateFake).to.have.been.calledWith(body);
    expect(commandFake).to.have.been.calledWith({
      name,
      domain,
    });
    expect(setFake).to.have.been.calledWith({
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
      context,
      claims,
    });
    expect(issueFake).to.have.been.calledWith(payload, {
      ...headers,
      root,
    });
    expect(statusFake).to.have.been.calledWith(statusCode);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params on a different network and different service", async () => {
    const validateFake = fake();
    replace(deps, "validate", validateFake);

    const issueFake = fake.returns({
      body: {
        ...response,
        tokens: [{ a: 1 }],
      },
      statusCode,
    });
    const setFake = fake.returns({
      issue: issueFake,
    });
    const commandFake = fake.returns({
      set: setFake,
    });
    replace(deps, "command", commandFake);

    const req = {
      context,
      claims,
      body,
      params: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const cookieFake = fake();
    const res = {
      cookie: cookieFake,
      set: setResponseFake,
    };

    const network = "some-random-network";
    const service = "some-random-service";
    const externalTokenResult = "some-external-token-result";
    const externalTokenFnFake = fake.returns(externalTokenResult);
    await post({
      name,
      domain,
      internalTokenFn,
      externalTokenFn: externalTokenFnFake,
      key,
      network,
      service,
    })(req, res);

    expect(validateFake).to.have.been.calledWith(body);
    expect(commandFake).to.have.been.calledWith({
      name,
      domain,
      service,
      network,
    });
    expect(setFake).to.have.been.calledWith({
      token: {
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
        internalFn: internalTokenFn,
        key,
      },
      context,
      claims,
    });
    expect(issueFake).to.have.been.calledWith(payload, {
      ...headers,
      root,
    });
    expect(statusFake).to.have.been.calledWith(statusCode);
  });
  it("should call with the correct params if response is empty", async () => {
    const validateFake = fake();
    replace(deps, "validate", validateFake);

    const issueFake = fake.returns({ statusCode });
    const setFake = fake.returns({
      issue: issueFake,
    });
    const commandFake = fake.returns({
      set: setFake,
    });
    replace(deps, "command", commandFake);

    const req = {
      context,
      claims,
      body,
      params: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const resSetFake = fake.returns({
      status: statusFake,
    });
    const cookieFake = fake();
    const res = {
      set: resSetFake,
      cookie: cookieFake,
    };

    const externalTokenResult = "some-external-token-result";
    const externalTokenFnFake = fake.returns(externalTokenResult);
    await post({
      name,
      domain,
      internalTokenFn,
      externalTokenFn: externalTokenFnFake,
      key,
    })(req, res);

    expect(validateFake).to.have.been.calledWith(body);
    expect(commandFake).to.have.been.calledWith({
      name,
      domain,
    });
    expect(setFake).to.have.been.calledWith({
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
      context,
      claims,
    });
    expect(issueFake).to.have.been.calledWith(payload, {
      ...headers,
      root,
    });
    expect(statusFake).to.have.been.calledWith(statusCode);
    expect(sendFake).to.have.been.calledWith();
  });
  it("should call with the correct params if tokens is in the response and token in req", async () => {
    const validateFake = fake();
    replace(deps, "validate", validateFake);

    const token1Network = "some-token1-network";
    const token1Type = "some-token1-type";
    const token1Value = "some-token1-value";
    const token2Network = "some-token2-network";
    const token2Type = "some-token2-type";
    const token2Value = "some-token2-value";
    const token1 = {
      network: token1Network,
      type: token1Type,
      value: token1Value,
    };
    const token2 = {
      network: token2Network,
      type: token2Type,
      value: token2Value,
    };
    const issueFake = fake.returns({
      body: { tokens: [token1, token2] },
      statusCode,
    });
    const setFake = fake.returns({
      issue: issueFake,
    });
    const commandFake = fake.returns({
      set: setFake,
    });
    replace(deps, "command", commandFake);

    const reqToken = "some-req-token";
    const req = {
      context,
      claims,
      body,
      token: reqToken,
      params: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const resSetFake = fake.returns({
      status: statusFake,
    });
    const cookieFake = fake();
    const res = {
      cookie: cookieFake,
      set: resSetFake,
    };

    const externalTokenFnFake = fake();
    await post({
      name,
      domain,
      internalTokenFn,
      externalTokenFn: externalTokenFnFake,
      key,
    })(req, res);
    expect(externalTokenFnFake).to.not.have.been.called;

    expect(cookieFake).to.have.been.calledTwice;
    expect(cookieFake).to.have.been.calledWith(token1Type, token1Value, {
      domain: token1Network,
      httpOnly: true,
      secure: true,
    });
    expect(cookieFake).to.have.been.calledWith(token2Type, token2Value, {
      domain: token2Network,
      httpOnly: true,
      secure: true,
    });
    expect(validateFake).to.have.been.calledWith(body);
    expect(commandFake).to.have.been.calledWith({
      name,
      domain,
    });
    expect(setFake).to.have.been.calledWith({
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn();
          return result.token == reqToken && result.type == "Bearer";
        }),
        key,
      },
      context,
      claims,
    });
    expect(issueFake).to.have.been.calledWith(payload, {
      ...headers,
      root,
    });
    expect(statusFake).to.have.been.calledWith(204);
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const validateFake = fake.rejects(new Error(errorMessage));
    replace(deps, "validate", validateFake);

    const req = {
      context,
      body,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const cookieFake = fake();
    const res = {
      status: statusFake,
      cookie: cookieFake,
    };

    try {
      await post({ name, domain, internalTokenFn })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
