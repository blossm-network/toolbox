const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const authorizationMiddleware = require("..");

const permissionsLookupFn = "some-permissions-lookup-fn";
const permissions = "some-permissions";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";
const policy = "some-policy";

const envNetwork = "some-env-network";
const envService = "some-env-service";
process.env.NETWORK = envNetwork;
process.env.SERVICE = envService;

const root = "some-root";
const sessionRoot = "some-session-root";
const session = { root: sessionRoot };
const reqSession = "some-req-session";

describe("Authorization middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const context = { session };
    const path = "some-path";
    const req = {
      path,
      session: reqSession,
      context,
      body: {
        root
      }
    };

    const authorizationFake = fake.returns(policy);
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();
    const terminatedSessionCheckFake = fake();

    await authorizationMiddleware({
      domain,
      service,
      network,
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      permissions
    })(req, null, nextFake);

    expect(authorizationFake).to.have.been.calledWith({
      path,
      context,
      session: reqSession,
      permissionsLookupFn,
      root,
      permissions,
      domain,
      service,
      network
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
      session: reqSession,
      context: otherContext,
      body: {}
    };

    const authorizationFake = fake.returns(policy);
    replace(deps, "authorize", authorizationFake);

    const terminatedSessionCheckFake = fake();

    const nextFake = fake();
    await authorizationMiddleware({
      domain,
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      permissions
    })(req, null, nextFake);

    expect(authorizationFake).to.have.been.calledWith({
      path,
      session: reqSession,
      context: otherContext,
      permissionsLookupFn,
      permissions,
      domain,
      service: envService,
      network: envNetwork
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
      session: reqSession,
      body: {}
    };

    const error = new Error();
    const authorizationFake = fake.rejects(error);
    replace(deps, "authorize", authorizationFake);

    const terminatedSessionCheckFake = fake();
    const nextFake = fake();

    await authorizationMiddleware({
      domain,
      service,
      network,
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
      session: reqSession,
      context,
      body: {
        root
      }
    };

    const authorizationFake = fake.returns(policy);
    replace(deps, "authorize", authorizationFake);

    const error = new Error();

    const terminatedSessionCheckFake = fake.rejects(error);
    const nextFake = fake();

    await authorizationMiddleware({
      domain,
      service,
      network,
      permissionsLookupFn,
      terminatedSessionCheckFn: terminatedSessionCheckFake,
      permissions
    })(req, null, nextFake);

    expect(nextFake).to.have.been.calledWith(error);
  });
});
