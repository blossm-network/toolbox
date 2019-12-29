const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const authorizationMiddleware = require("..");

const permissionsLookupFn = "some-permissions-lookup-fn";
const priviledges = "some-priv";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";

const envNetwork = "some-env-network";
const envService = "some-env-service";
process.env.NETWORK = envNetwork;
process.env.SERVICE = envService;

const root = "some-root";

describe("Authorization middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const context = "some-context";
    const claims = "some-claims";
    const path = "some-path";
    const req = {
      path,
      claims,
      body: {
        root
      }
    };

    const authorizationFake = fake.returns({ context });
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();
    await authorizationMiddleware({
      domain,
      service,
      network,
      permissionsLookupFn,
      priviledges
    })(req, null, nextFake);

    expect(authorizationFake).to.have.been.calledWith({
      path,
      claims,
      permissionsLookupFn,
      root,
      priviledges,
      domain,
      service,
      network
    });

    expect(req.context).to.deep.equal(context);
    expect(nextFake).to.have.been.calledOnce;
  });
  it("should call correctly with optionals", async () => {
    const context = "some-context";
    const claims = "some-claims";
    const path = "some-path";
    const req = {
      path,
      claims,
      body: {}
    };

    const authorizationFake = fake.returns({ context });
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();
    await authorizationMiddleware({
      domain,
      permissionsLookupFn,
      priviledges
    })(req, null, nextFake);

    expect(authorizationFake).to.have.been.calledWith({
      path,
      claims,
      permissionsLookupFn,
      priviledges,
      domain,
      service: envService,
      network: envNetwork
    });

    expect(req.context).to.deep.equal(context);
    expect(nextFake).to.have.been.calledOnce;
  });
  it("should throw correctly", async () => {
    const claims = "some-claims";
    const path = "some-path";
    const req = {
      path,
      claims,
      body: {}
    };

    const error = new Error();
    const authorizationFake = fake.rejects(error);
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();

    await authorizationMiddleware({
      domain,
      service,
      network,
      permissionsLookupFn,
      priviledges
    })(req, null, nextFake);

    expect(nextFake).to.have.been.calledWith(error);
  });
});
