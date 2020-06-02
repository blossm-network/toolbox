const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const authenticationMiddleware = require("..");

const verifyFn = "some-verify-fn";
const keyClaimsFn = "some-claims-fn";
const algorithm = "some-algorithm";
const audience = "some-audience";
const allowBasic = "some-allow-basic";
const cookieKey = "some-cookie-key";

const jwt = "some-bearer";

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
    const jwt = "some-jwt";
    const claims = {
      context,
      iss,
      aud,
      sub,
      exp,
      iat,
      jti,
    };
    const req = {};

    const tokensFromReqFake = fake.returns({ bearer: jwt });
    replace(deps, "tokensFromReq", tokensFromReqFake);
    const authenticateFake = fake.returns(claims);
    replace(deps, "authenticate", authenticateFake);

    const nextFake = fake();

    await authenticationMiddleware({
      verifyFn,
      keyClaimsFn,
      audience,
      algorithm,
      cookieKey,
    })(req, null, nextFake);

    expect(tokensFromReqFake).to.have.been.calledWith(req, { cookieKey });
    expect(authenticateFake).to.have.been.calledWith({
      jwt,
      verifyFn,
      keyClaimsFn,
      audience,
      algorithm,
    });
    expect(req.context).to.deep.equal(context);
    expect(req.token).to.deep.equal(jwt);
    expect(req.claims).to.deep.equal({
      iss,
      aud,
      sub,
      exp,
      iat,
      jti,
    });
    expect(nextFake).to.have.been.calledOnce;
  });
  it("should call correctly with cookie token", async () => {
    const iss = "some-iss";
    const aud = "some-aud";
    const sub = "some-sub";
    const exp = "some-exp";
    const iat = "some-iat";
    const jti = "some-jti";
    const context = "some-context";
    const jwt = "some-jwt";
    const claims = {
      context,
      iss,
      aud,
      sub,
      exp,
      iat,
      jti,
    };
    const req = {};

    const tokensFromReqFake = fake.returns({ cookie: jwt });
    replace(deps, "tokensFromReq", tokensFromReqFake);
    const authenticateFake = fake.returns(claims);
    replace(deps, "authenticate", authenticateFake);

    const nextFake = fake();

    await authenticationMiddleware({
      verifyFn,
      keyClaimsFn,
      audience,
      algorithm,
      cookieKey,
    })(req, null, nextFake);

    expect(tokensFromReqFake).to.have.been.calledWith(req, { cookieKey });
    expect(authenticateFake).to.have.been.calledWith({
      jwt,
      verifyFn,
      keyClaimsFn,
      audience,
      algorithm,
    });
    expect(req.context).to.deep.equal(context);
    expect(req.token).to.deep.equal(jwt);
    expect(req.claims).to.deep.equal({
      iss,
      aud,
      sub,
      exp,
      iat,
      jti,
    });
    expect(nextFake).to.have.been.calledOnce;
  });
  it("should call correctly with basic", async () => {
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
      jti,
    };
    const req = {};

    const basic = "some-basic";
    const tokensFromReqFake = fake.returns({ basic });
    replace(deps, "tokensFromReq", tokensFromReqFake);
    const authenticateFake = fake.returns(claims);
    replace(deps, "authenticate", authenticateFake);

    const nextFake = fake();

    await authenticationMiddleware({
      verifyFn,
      keyClaimsFn,
      audience,
      algorithm,
      cookieKey,
      allowBasic: true,
    })(req, null, nextFake);

    expect(tokensFromReqFake).to.have.been.calledWith(req, { cookieKey });
    expect(authenticateFake).to.have.been.calledWith({
      basic,
      verifyFn,
      keyClaimsFn,
      audience,
      algorithm,
    });
    expect(req.context).to.deep.equal(context);
    expect(req.token).to.be.undefined;
    expect(req.claims).to.deep.equal({
      iss,
      aud,
      sub,
      exp,
      iat,
      jti,
    });
    expect(nextFake).to.have.been.calledOnce;
  });
  it("should call correctly with basic without allowBasic", async () => {
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
      jti,
    };
    const req = {};

    const basic = "some-basic";
    const tokensFromReqFake = fake.returns({ basic });
    replace(deps, "tokensFromReq", tokensFromReqFake);
    const authenticateFake = fake.returns(claims);
    replace(deps, "authenticate", authenticateFake);

    const nextFake = fake();

    await authenticationMiddleware({
      verifyFn,
      keyClaimsFn,
      audience,
      algorithm,
      cookieKey,
    })(req, null, nextFake);

    expect(authenticateFake).to.have.been.calledWith({
      verifyFn,
      keyClaimsFn,
      audience,
      algorithm,
    });
  });
  it("should call correctly with strict off", async () => {
    const tokensFromReqFake = fake.returns({ bearer: jwt });
    replace(deps, "tokensFromReq", tokensFromReqFake);

    const errorMessage = "some-error-message";
    const error = new Error(errorMessage);
    const authenticateFake = fake.rejects(error);
    replace(deps, "authenticate", authenticateFake);

    const nextFake = fake();

    const req = {};

    await authenticationMiddleware({
      verifyFn,
      keyClaimsFn,
      audience,
      algorithm,
      strict: false,
      allowBasic,
      cookieKey,
    })(req, null, nextFake);

    expect(authenticateFake).to.have.been.calledWith({
      jwt,
      verifyFn,
      keyClaimsFn,
      audience,
      algorithm,
    });
    expect(req.token).to.equal(jwt);
    expect(nextFake).to.have.been.calledOnce;
  });
  it("should throw correctly", async () => {
    const tokensFromReqFake = fake.returns({ bearer: jwt });
    replace(deps, "tokensFromReq", tokensFromReqFake);
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
