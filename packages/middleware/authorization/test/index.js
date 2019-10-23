const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const authorizationMiddleware = require("..");

const scopesLookupFn = "some-scopes-lookup-fn";
const priviledgesLookupFn = "some-priv-lookup-fn";

describe("Authorization middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const context = "some-context";
    const claims = "some-claims";
    const path = "some-path";
    const params = {
      domain: "some-domain"
    };
    const req = {
      path,
      params,
      claims
    };

    const authorizationFake = fake.returns(context);
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();
    await authorizationMiddleware({ scopesLookupFn, priviledgesLookupFn })(
      req,
      null,
      nextFake
    );

    expect(authorizationFake).to.have.been.calledWith({
      path,
      claims,
      scopesLookupFn,
      priviledgesLookupFn,
      domain: params.domain
    });

    expect(req.context).to.deep.equal(context);
    expect(nextFake).to.have.been.calledOnce;
  });
  it("should throw correctly", async () => {
    const claims = "some-claims";
    const path = "some-path";
    const params = {
      domain: "some-domain"
    };
    const req = {
      path,
      params,
      claims
    };

    const authorizationFake = fake.rejects(new Error());
    replace(deps, "authorize", authorizationFake);

    const nextFake = fake();

    expect(async () => await authorizationMiddleware(req, null, nextFake)).to
      .throw;
  });
});
