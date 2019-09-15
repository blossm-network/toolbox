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

    await authenticationMiddleware(req);

    expect(authenticateFake).to.have.been.calledWith({
      req,
      verifyFn: kms.verify,
      //temporary
      requiresToken: false
    });
    expect(req.claims).to.deep.equal(claims);
  });
});
