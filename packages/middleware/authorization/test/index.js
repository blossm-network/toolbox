const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const authorizationMiddleware = require("..");

const scopesLookupFn = "some-scopes-lookup-fn";
const priviledgesLookupFn = "some-priv-lookup-fn";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";

const envNetwork = "some-env-network";
const envService = "some-env-service";
process.env.NETWORK = envNetwork;
process.env.SERVICE = envService;

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
      claims
    };

    const authorizationFake = fake.returns({ context });
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();
    await authorizationMiddleware({
      domain,
      service,
      network,
      scopesLookupFn,
      priviledgesLookupFn
    })(req, null, nextFake);

    expect(authorizationFake).to.have.been.calledWith({
      path,
      claims,
      scopesLookupFn,
      priviledgesLookupFn,
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
      claims
    };

    const authorizationFake = fake.returns({ context });
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();
    await authorizationMiddleware({
      domain,
      scopesLookupFn,
      priviledgesLookupFn
    })(req, null, nextFake);

    expect(authorizationFake).to.have.been.calledWith({
      path,
      claims,
      scopesLookupFn,
      priviledgesLookupFn,
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
      claims
    };

    const error = new Error();
    const authorizationFake = fake.rejects(error);
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();

    await authorizationMiddleware({
      domain,
      service,
      network,
      scopesLookupFn,
      priviledgesLookupFn
    })(req, null, nextFake);

    expect(nextFake).to.have.been.calledWith(error);
  });
});
