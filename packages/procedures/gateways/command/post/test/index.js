const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, replace, fake, match, useFakeTimers } = require("sinon");
const { string: dateString } = require("@blossm/datetime");

const deps = require("../deps");
const post = require("..");

let clock;

const now = new Date();

const response = { a: 1 };
const payload = "some-payload";
const issued = "some-issued";
const ip = "some-ip";
const headers = {
  issued,
};
const name = "some-name";
const domain = "some-domain";
const procesdureContext = "some-procedure-context";
const context = {
  [procesdureContext]: "some-thing",
};
const redirect = "some-redirect";
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
    const tokenToRevokeType = "some-type-to-revoke";
    const tokenToRevokeNetwork = "some-network-to-revoke";
    const issueFake = fake.returns({
      body: {
        ...response,
        _tokens: [{ a: 1 }],
        _revoke: [{ type: tokenToRevokeType, network: tokenToRevokeNetwork }],
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
      headers: {
        "x-forwarded-for": ip,
      },
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const cookieFake = fake();
    const clearCookieFake = fake();
    const res = {
      cookie: cookieFake,
      status: statusFake,
      clearCookie: clearCookieFake,
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
    expect(clearCookieFake).to.have.been.calledWith(tokenToRevokeType, {
      domain: tokenToRevokeNetwork,
      httpOnly: true,
      secure: true,
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
            })
          );
        }),
      },
    });
    expect(issueFake).to.have.been.calledWith(payload, {
      tx: {
        ip,
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
        _tokens: [{ a: 1 }],
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
    const context1 = "some-context1";
    const context2 = "some-context2";
    const req = {
      context: {
        ...context,
        [context1]: "some",
        [context2]: "some-other",
      },
      claims,
      token: reqToken,
      body,
      params: {},
      headers: {
        "x-forwarded-for": ip,
      },
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
      context: [context1, context2],
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
      },
      currentToken: req.token,
      claims,
      context: {
        ...context,
        [context1]: "some",
        [context2]: "some-other",
      },
    });
    expect(issueFake).to.have.been.calledWith(payload, {
      tx: {
        ip,
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
        _tokens: [{ a: 1 }],
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
      headers: {
        "x-forwarded-for": ip,
      },
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
      },
      currentToken: req.token,
      claims,
      context,
    });
    expect(issueFake).to.have.been.calledWith(payload, {
      tx: {
        ip,
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
      headers: {
        "x-forwarded-for": ip,
      },
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
            })
          );
        }),
      },
      context,
      claims,
    });
    expect(issueFake).to.have.been.calledWith(payload, {
      tx: {
        ip,
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
      body: { _tokens: [token1, token2] },
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
    const decodeFake = fake.returns({ claims: { exp: dateString() } });
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
      headers: {
        "x-forwarded-for": ip,
      },
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
      },
      currentToken: reqToken,
      context,
      claims,
    });
    expect(issueFake).to.have.been.calledWith(payload, {
      root,
      headers: {
        idempotency,
      },
      tx: {
        ip,
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
  it("should redirect correctly if command throws 403", async () => {
    const errMessage = "some-error-message";

    const ForbiddenError = Error;
    ForbiddenError.prototype.statusCode = 403;
    ForbiddenError.prototype.message = errMessage;

    const validateFake = fake();
    replace(deps, "validate", validateFake);
    const issueFake = fake.throws(new ForbiddenError());
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
      headers: {
        "x-forwarded-for": ip,
      },
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

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });
    try {
      await post({
        name,
        domain,
        internalTokenFn,
        nodeExternalTokenFn: nodeExternalTokenFnFake,
        key,
        redirect,
      })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(errMessage, {
        info: { redirect },
      });
      expect(e).to.equal(error);
    }
  });
});
