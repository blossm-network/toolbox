const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const authorizationMiddleware = require("..");

const permissionsLookupFn = "some-permissions-lookup-fn";
const permissions = "some-permissions";

const envNetwork = "some-env-network";
const envService = "some-env-service";
process.env.NETWORK = envNetwork;
process.env.SERVICE = envService;

const session = "some-session";
const principal = "some-principal";

describe("Authorization middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const contextObj = "some-context-obj";
    const contextKey = "some-context-key";
    const context = { session, principal, [contextKey]: contextObj };
    const path = "some-path";
    const req = {
      path,
      context,
    };

    const authorizationFake = fake();
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();
    const terminatedSessionCheckFake = fake();

    await authorizationMiddleware({
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      permissions,
      context: contextKey,
    })(req, null, nextFake);

    expect(authorizationFake).to.have.been.calledWith({
      principal,
      permissionsLookupFn,
      permissions,
      context: contextObj,
    });
    expect(terminatedSessionCheckFake).to.have.been.calledWith({
      session,
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

    const nextFake = fake();
    await authorizationMiddleware({
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      permissions,
    })(req, null, nextFake);

    expect(authorizationFake).to.not.have.been.called;
    expect(terminatedSessionCheckFake).to.not.have.been.called;

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
    const nextFake = fake();

    await authorizationMiddleware({
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
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
      permissions,
    })(req, null, nextFake);

    expect(nextFake).to.have.been.calledWith(error);
  });
});
