const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, fake, replace, match } = require("sinon");
const deps = require("../deps");
const authorizationMiddleware = require("..");

const permissionsLookupFn = "some-permissions-lookup-fn";
const permissions = "some-permissions";
const token = "some-token";

const envNetwork = "some-env-network";
const envService = "some-env-service";
process.env.NETWORK = envNetwork;
process.env.SERVICE = envService;

const session = "some-session";
const scene = "some-scene";
const principal = "some-principal";
const internalTokenFn = "some-internal-token-fn";

describe("Authorization middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const contextObj = "some-context-obj";
    const contextKey = "some-context-key";
    const context = { session, scene, principal, [contextKey]: contextObj };
    const path = "some-path";
    const req = {
      path,
      context,
      token,
    };

    const authorizationFake = fake();
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();
    const terminatedSessionCheckFake = fake();
    const deletedSceneCheckFake = fake();

    await authorizationMiddleware({
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      deletedSceneCheckFn: deletedSceneCheckFake,
      internalTokenFn,
      permissions,
      context: contextKey,
    })(req, null, nextFake);

    expect(authorizationFake).to.have.been.calledWith({
      principal,
      permissionsLookupFn,
      internalTokenFn,
      externalTokenFn: match((fn) => {
        const result = fn();
        return result.token == token && result.type == "Bearer";
      }),
      permissions,
      context: contextObj,
    });
    expect(terminatedSessionCheckFake).to.have.been.calledWith({
      session,
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn();
          return result.token == token && result.type == "Bearer";
        }),
      },
    });
    expect(deletedSceneCheckFake).to.have.been.calledWith({
      scene,
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn();
          return result.token == token && result.type == "Bearer";
        }),
      },
    });

    expect(nextFake).to.have.been.calledOnce;
  });
  it("should call correctly if node and context.network matches", async () => {
    const network = "some-network";
    const contextObj = {
      network,
    };
    const contextKey = "some-context-key";
    const context = {
      network,
      session,
      scene,
      principal,
      [contextKey]: contextObj,
    };
    const path = "some-path";
    const req = {
      path,
      context,
      token,
    };

    const authorizationFake = fake();
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();
    const terminatedSessionCheckFake = fake();
    const deletedSceneCheckFake = fake();

    await authorizationMiddleware({
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      deletedSceneCheckFn: deletedSceneCheckFake,
      internalTokenFn,
      permissions,
      context: contextKey,
      node: true,
    })(req, null, nextFake);

    expect(authorizationFake).to.not.have.been.called;
    expect(terminatedSessionCheckFake).to.have.been.calledWith({
      session,
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn();
          return result.token == token && result.type == "Bearer";
        }),
      },
    });
    expect(deletedSceneCheckFake).to.have.been.calledWith({
      scene,
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn();
          return result.token == token && result.type == "Bearer";
        }),
      },
    });

    expect(nextFake).to.have.been.calledOnce;
  });
  it("should call correctly if node and context.network doesn't match", async () => {
    const contextObj = {
      network: "some-bogus",
    };
    const contextKey = "some-context-key";
    const context = {
      network: "whatever",
      session,
      scene,
      principal,
      [contextKey]: contextObj,
    };
    const path = "some-path";
    const req = {
      path,
      context,
      token,
    };

    const authorizationFake = fake();
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();
    const terminatedSessionCheckFake = fake();
    const deletedSceneCheckFake = fake();

    await authorizationMiddleware({
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      deletedSceneCheckFn: deletedSceneCheckFake,
      internalTokenFn,
      permissions,
      context: contextKey,
      node: true,
    })(req, null, nextFake);

    expect(authorizationFake).to.have.been.calledWith({
      principal,
      permissionsLookupFn,
      internalTokenFn,
      externalTokenFn: match((fn) => {
        const result = fn();
        return result.token == token && result.type == "Bearer";
      }),
      permissions,
      context: contextObj,
    });
    expect(terminatedSessionCheckFake).to.have.been.calledWith({
      session,
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn();
          return result.token == token && result.type == "Bearer";
        }),
      },
    });
    expect(deletedSceneCheckFake).to.have.been.calledWith({
      scene,
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn();
          return result.token == token && result.type == "Bearer";
        }),
      },
    });

    expect(nextFake).to.have.been.calledOnce;
  });
  it("should call correctly with optionals", async () => {
    const otherContext = "some-context";
    const path = "some-path";
    const req = {
      path,
      context: otherContext,
      body: {},
    };

    const authorizationFake = fake();
    replace(deps, "authorize", authorizationFake);

    const terminatedSessionCheckFake = fake();
    const deletedSceneCheckFake = fake();

    const nextFake = fake();
    await authorizationMiddleware({
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      deletedSceneCheckFn: deletedSceneCheckFake,
      internalTokenFn,
      permissions,
    })(req, null, nextFake);

    expect(authorizationFake).to.not.have.been.called;
    expect(terminatedSessionCheckFake).to.not.have.been.called;
    expect(deletedSceneCheckFake).to.not.have.been.called;

    expect(nextFake).to.have.been.calledOnce;
  });
  it("should throw correctly", async () => {
    const path = "some-path";
    const req = {
      path,
      context: {},
      body: {},
    };

    const error = new Error();
    const authorizationFake = fake.rejects(error);
    replace(deps, "authorize", authorizationFake);

    const terminatedSessionCheckFake = fake();
    const deletedSceneCheckFake = fake();
    const nextFake = fake();

    await authorizationMiddleware({
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      deletedSceneCheckFn: deletedSceneCheckFake,
      internalTokenFn,
      permissions,
    })(req, null, nextFake);

    expect(nextFake).to.have.been.calledWith(error);
  });
  it("should throw correctly if terminated session check throws", async () => {
    const context = { session };
    const path = "some-path";
    const req = {
      path,
      context,
    };

    const authorizationFake = fake();
    replace(deps, "authorize", authorizationFake);

    const error = new Error();

    const terminatedSessionCheckFake = fake.rejects(error);
    const nextFake = fake();

    await authorizationMiddleware({
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      internalTokenFn,
      permissions,
    })(req, null, nextFake);

    expect(nextFake).to.have.been.calledWith(error);
  });
});
