const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const authenticationMiddleware = require("..");

const verifyFn = "some-verify-fn";
const keyClaimsFn = "some-claims-fn";

describe("Authentication middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const iss = "some-iss";
    const aud = "some-aud";
    const sub = "some-sub";
    const exp = "some-exp";
    const iat = "some-iat";
    const jti = "some-jti";
    const context = "some-context";
    const claims = {
      context,
      iss,
      aud,
      sub,
      exp,
      iat,
      jti
    };
    const req = {};

    const authenticateFake = fake.returns(claims);
    replace(deps, "authenticate", authenticateFake);

    const nextFake = fake();

    await authenticationMiddleware({ verifyFn, keyClaimsFn })(
      req,
      null,
      nextFake
    );

    expect(authenticateFake).to.have.been.calledWith({
      req,
      verifyFn,
      keyClaimsFn
    });
    expect(req.context).to.deep.equal(context);
    expect(req.claims).to.deep.equal({
      iss,
      aud,
      sub,
      exp,
      iat,
      jti
    });
    expect(nextFake).to.have.been.calledOnce;
  });
  it("should call correctly with strict off", async () => {
    const errorMessage = "some-error-message";
    const error = new Error(errorMessage);
    const authenticateFake = fake.rejects(error);
    replace(deps, "authenticate", authenticateFake);

    const nextFake = fake();

    const req = fake();

    await authenticationMiddleware({ verifyFn, keyClaimsFn, strict: false })(
      req,
      null,
      nextFake
    );

    expect(authenticateFake).to.have.been.calledWith({
      req,
      verifyFn,
      keyClaimsFn
    });
    expect(nextFake).to.have.been.calledOnce;
  });
  it("should throw correctly", async () => {
    const req = {};

    const errorMessage = "some-error-message";
    const error = new Error(errorMessage);
    const authenticateFake = fake.rejects(error);
    replace(deps, "authenticate", authenticateFake);

    const nextFake = fake();

    await authenticationMiddleware(verifyFn)(req, null, nextFake);
    expect(nextFake).to.have.been.calledWith(error);
  });
});
