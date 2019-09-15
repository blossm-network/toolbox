const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const kms = require("@sustainers/gcp-kms");
const deps = require("../deps");
const authenticationMiddleware = require("..");

describe("Authentication middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const claims = "some-claims";
    const req = {};

    const authenticateFake = fake.returns(claims);
    replace(deps, "authenticate", authenticateFake);

    const nextFake = fake();
    await authenticationMiddleware(req, null, nextFake);

    expect(authenticateFake).to.have.been.calledWith({
      req,
      verifyFn: kms.verify,
      //temporary
      requiresToken: false
    });
    expect(req.claims).to.deep.equal(claims);
    expect(nextFake).to.have.been.calledOnce;
  });
  it("should throw correctly", async () => {
    const req = {};

    const authenticateFake = fake.rejects(new Error());
    replace(deps, "authenticate", authenticateFake);

    const nextFake = fake();

    expect(async () => await authenticationMiddleware(req, null, nextFake)).to
      .throw;
  });
});
