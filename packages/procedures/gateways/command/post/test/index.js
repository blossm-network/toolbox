const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match, useFakeTimers } = require("sinon");
const { string: dateString } = require("@blossm/datetime");

const deps = require("../deps");
const post = require("..");

let clock;

const now = new Date();

const response = { a: 1 };
const payload = "some-payload";
const issued = "some-issued";
const headers = {
  issued,
};
const name = "some-name";
const domain = "some-domain";
const context = "some-context";
const claims = "some-claims";
const internalTokenFn = "some-internal-token-fn";
const statusCode = "some-status-code";
const key = "some-key";
const externalTokenNetwork = "some-external-token-network";
const externalTokenKey = "some-external-token-key";

const procedure = "some-procedure";
const hash = "some-hash";
const envDomain = "some-env-domain";
const envService = "some-env-service";
const envNetwork = "some-network";
const host = "some-host";

process.env.OPERATION_HASH = hash;
process.env.DOMAIN = envDomain;
process.env.SERVICE = envService;
process.env.NETWORK = envNetwork;
process.env.HOST = host;
process.env.PROCEDURE = procedure;

const body = {
  payload,
  headers,
};

describe("Command gateway post", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    restore();
    clock.restore();
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
      body,
      params: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const cookieFake = fake();
    const res = {
      cookie: cookieFake,
      status: statusFake,
    };
    const nodeExternalTokenResult = "some-external-token-result";
    const nodeExternalTokenFnFake = fake.returns(nodeExternalTokenResult);
    await post({
      name,
      domain,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
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
            result == nodeExternalTokenResult &&
            nodeExternalTokenFnFake.calledWith({
              network: externalTokenNetwork,
              key: externalTokenKey,
            })
          );
        }),
        key,
      },
    });

    expect(issueFake).to.have.been.calledWith(payload, {
      headers: {
        path: [
          {
            procedure,
            hash,
            issued,
            timestamp: deps.dateString(),
            domain: envDomain,
            service: envService,
            network: envNetwork,
            host,
          },
        ],
      },
    });
    expect(statusFake).to.have.been.calledWith(statusCode);
    expect(sendFake).to.have.been.calledWith({
      ...response,
    });
  });
  it("should call with the correct params on a different network and different service, with claims and context", async () => {
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

    const reqToken = "some-req-token";
    const req = {
      context,
      claims,
      token: reqToken,
      body,
      params: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const cookieFake = fake();
    const res = {
      cookie: cookieFake,
      status: statusFake,
    };

    const network = "some-random-network";
    const service = "some-random-service";
    const nodeExternalTokenResult = "some-node-external-token-result";
    const nodeExternalTokenFnFake = fake.returns(nodeExternalTokenResult);
    await post({
      name,
      domain,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
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
          const result = fn();
          return result.token == reqToken && result.type == "Bearer";
        }),
        internalFn: internalTokenFn,
        key,
      },
      currentToken: req.token,
      claims,
      context,
    });
    expect(issueFake).to.have.been.calledWith(payload, {
      headers: {
        path: [
          {
            procedure,
            hash,
            issued,
            timestamp: deps.dateString(),
            domain: envDomain,
            service: envService,
            network: envNetwork,
            host,
          },
        ],
      },
    });
    expect(statusFake).to.have.been.calledWith(statusCode);
  });
  it("should call with the correct params on a different network in a non prod env", async () => {
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

    const reqToken = "some-req-token";
    const req = {
      context,
      claims,
      token: reqToken,
      body,
      params: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const cookieFake = fake();
    const res = {
      cookie: cookieFake,
      status: statusFake,
    };

    const network = "some-random-network";
    const service = "some-random-service";
    const nodeExternalTokenResult = "some-node-external-token-result";
    const nodeExternalTokenFnFake = fake.returns(nodeExternalTokenResult);
    process.env.NODE_ENV = "something-else";
    await post({
      name,
      domain,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
      key,
      network,
      service,
    })(req, res);

    expect(validateFake).to.have.been.calledWith(body);
    expect(commandFake).to.have.been.calledWith({
      name,
      domain,
      service,
      network: `snd.${network}`,
    });
    expect(setFake).to.have.been.calledWith({
      token: {
        externalFn: match((fn) => {
          const result = fn();
          return result.token == reqToken && result.type == "Bearer";
        }),
        internalFn: internalTokenFn,
        key,
      },
      currentToken: req.token,
      claims,
      context,
    });
    expect(issueFake).to.have.been.calledWith(payload, {
      headers: {
        path: [
          {
            procedure,
            hash,
            issued,
            timestamp: deps.dateString(),
            domain: envDomain,
            service: envService,
            network: envNetwork,
            host,
          },
        ],
      },
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
    const cookieFake = fake();
    const res = {
      status: statusFake,
      cookie: cookieFake,
    };

    const nodeExternalTokenResult = "some-external-token-result";
    const nodeExternalTokenFnFake = fake.returns(nodeExternalTokenResult);
    await post({
      name,
      domain,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
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
            result == nodeExternalTokenResult &&
            nodeExternalTokenFnFake.calledWith({
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
      headers: {
        path: [
          {
            procedure,
            hash,
            issued,
            timestamp: deps.dateString(),
            domain: envDomain,
            service: envService,
            network: envNetwork,
            host,
          },
        ],
      },
    });
    expect(statusFake).to.have.been.calledWith(statusCode);
    expect(sendFake).to.have.been.calledWith();
  });
  it("should call with the correct params if tokens is in the response, token in req, cookies in headers, and idempotenct in req.headers, and root", async () => {
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
    const cookie = "some-cookie";
    const issueFake = fake.returns({
      body: { tokens: [token1, token2] },
      headers: { "set-cookie": cookie },
      statusCode,
    });
    const setFake = fake.returns({
      issue: issueFake,
    });
    const commandFake = fake.returns({
      set: setFake,
    });
    replace(deps, "command", commandFake);

    const decodeFake = fake.returns({ headers: { exp: dateString() } });
    replace(deps, "decode", decodeFake);

    const reqToken = "some-req-token";
    const idempotency = "some-idempotency";
    const root = "some-root";
    const req = {
      context,
      claims,
      body: {
        ...body,
        headers: {
          ...body.headers,
          idempotency,
        },
        root,
      },
      token: reqToken,
      params: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const cookieFake = fake();
    const resSetFake = fake();
    const res = {
      set: resSetFake,
      cookie: cookieFake,
      status: statusFake,
    };

    const nodeExternalTokenFnFake = fake();
    await post({
      name,
      domain,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
      key,
    })(req, res);
    expect(nodeExternalTokenFnFake).to.not.have.been.called;

    expect(resSetFake).to.have.been.calledWith("set-cookie", cookie);
    expect(cookieFake).to.have.been.calledTwice;
    expect(cookieFake).to.have.been.calledWith(token1Type, token1Value, {
      domain: token1Network,
      httpOnly: true,
      secure: true,
      expires: new Date(dateString()),
    });
    expect(cookieFake).to.have.been.calledWith(token2Type, token2Value, {
      domain: token2Network,
      httpOnly: true,
      secure: true,
      expires: new Date(dateString()),
    });
    expect(validateFake).to.have.been.calledWith({
      ...body,
      headers: {
        ...body.headers,
        idempotency,
      },
      root,
    });
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
      currentToken: reqToken,
      context,
      claims,
    });
    expect(issueFake).to.have.been.calledWith(payload, {
      root,
      headers: {
        idempotency,
        path: [
          {
            procedure,
            hash,
            issued,
            timestamp: deps.dateString(),
            domain: envDomain,
            service: envService,
            network: envNetwork,
            host,
          },
        ],
      },
    });
    expect(decodeFake.getCall(0)).to.have.been.calledWith(token1Value);
    expect(decodeFake.getCall(1)).to.have.been.calledWith(token2Value);
    expect(sendFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(statusCode);
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
