const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const authorizationMiddleware = require("..");

const permissionsLookupFn = "some-permissions-lookup-fn";
const permissions = "some-permissions";
const policy = "some-policy";

const envNetwork = "some-env-network";
const envService = "some-env-service";
process.env.NETWORK = envNetwork;
process.env.SERVICE = envService;

const sessionRoot = "some-session-root";
const session = { root: sessionRoot };
const reqClaims = "some-req-claims";

describe("Authorization middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const context = { session };
    const path = "some-path";
    const req = {
      path,
      claims: reqClaims,
      context
    };

    const authorizationFake = fake.returns(policy);
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();
    const terminatedSessionCheckFake = fake();

    await authorizationMiddleware({
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      permissions
    })(req, null, nextFake);

    expect(authorizationFake).to.have.been.calledWith({
      context,
      claims: reqClaims,
      permissionsLookupFn,
      permissions
    });
    expect(terminatedSessionCheckFake).to.have.been.calledWith({
      session: sessionRoot
    });

    expect(req.policy).to.deep.equal(policy);
    expect(nextFake).to.have.been.calledOnce;
  });
  it("should call correctly with optionals", async () => {
    const otherContext = "some-context";
    const path = "some-path";
    const req = {
      path,
      claims: reqClaims,
      context: otherContext,
      body: {}
    };

    const authorizationFake = fake.returns(policy);
    replace(deps, "authorize", authorizationFake);

    const terminatedSessionCheckFake = fake();

    const nextFake = fake();
    await authorizationMiddleware({
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      permissions
    })(req, null, nextFake);

    expect(authorizationFake).to.have.been.calledWith({
      claims: reqClaims,
      context: otherContext,
      permissionsLookupFn,
      permissions
    });
    expect(terminatedSessionCheckFake).to.not.have.been.called;

    expect(req.policy).to.deep.equal(policy);
    expect(nextFake).to.have.been.calledOnce;
  });
  it("should throw correctly", async () => {
    const path = "some-path";
    const req = {
      path,
      context: {},
      claims: reqClaims,
      body: {}
    };

    const error = new Error();
    const authorizationFake = fake.rejects(error);
    replace(deps, "authorize", authorizationFake);

    const terminatedSessionCheckFake = fake();
    const nextFake = fake();

    await authorizationMiddleware({
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      permissions
    })(req, null, nextFake);

    expect(nextFake).to.have.been.calledWith(error);
  });
  it("should throw correctly if terminated session check throws", async () => {
    const context = { session };
    const path = "some-path";
    const req = {
      path,
      claims: reqClaims,
      context
    };

    const authorizationFake = fake.returns(policy);
    replace(deps, "authorize", authorizationFake);

    const error = new Error();

    const terminatedSessionCheckFake = fake.rejects(error);
    const nextFake = fake();

    await authorizationMiddleware({
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      permissions
    })(req, null, nextFake);

    expect(nextFake).to.have.been.calledWith(error);
  });
});
