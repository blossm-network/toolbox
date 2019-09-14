const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const temp = require("../temp");
const authorizationMiddleware = require("..");

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

    await authorizationMiddleware(req);

    expect(authorizationFake).to.have.been.calledWith({
      path,
      claims,
      scopesLookupFn: temp,
      domain: params.domain
    });

    expect(req.context).to.deep.equal(context);
  });
});
