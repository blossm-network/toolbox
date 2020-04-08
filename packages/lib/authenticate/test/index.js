const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { string: dateString } = require("@blossm/datetime");

const deps = require("../deps");

const authenticate = require("..");

const verifyFn = "some-verify-fn";

const path = "some-path";
const req = {
  path
};
const bearer = "bearer-some";
const tokens = {
  bearer
};

const claims = {
  exp: dateString()
};
const audience = "some-audience";
const algorithm = "some-algorithm";

describe("Authorize", () => {
  afterEach(() => {
    restore();
  });
  it("should authentiate", async () => {
    const validateFake = fake.returns(claims);
    replace(deps, "validate", validateFake);
    replace(deps, "tokensFromReq", fake.returns(tokens));

    const result = await authenticate({
      req,
      verifyFn,
      audience,
      algorithm
    });

    expect(deps.tokensFromReq).to.have.been.calledWith(req);
    expect(deps.validate).to.have.been.calledWith({
      token: bearer,
      verifyFn,
      audience,
      algorithm
    });
    expect(result).to.deep.equal(claims);
  });
  it("should authenticate with cookie token", async () => {
    const cookieToken = "some-cookie-token";
    const cookieTokens = {
      cookie: cookieToken
    };

    replace(deps, "validate", fake.returns(claims));
    replace(deps, "tokensFromReq", fake.returns(cookieTokens));

    const response = await authenticate({
      req,
      verifyFn,
      audience,
      algorithm
    });

    expect(deps.tokensFromReq).to.have.been.calledWith(req);
    expect(deps.validate).to.have.been.calledWith({
      token: cookieToken,
      verifyFn,
      audience,
      algorithm
    });
    expect(response).to.deep.equal(claims);
  });
  it("should authenticate with basic token", async () => {
    const basicTokenId = "some-basic-id";
    const basicTokenSecret = "some-basic-secret";

    const basicToken = `${basicTokenId}:${basicTokenSecret}`;

    const buffer = Buffer.from(basicToken).toString("base64");

    const basicTokens = {
      basic: buffer
    };

    replace(deps, "tokensFromReq", fake.returns(basicTokens));

    const keyClaimsFnFake = fake.returns(claims);
    const response = await authenticate({
      req,
      verifyFn,
      keyClaimsFn: keyClaimsFnFake
    });

    expect(deps.tokensFromReq).to.have.been.calledWith(req);
    expect(keyClaimsFnFake).to.have.been.calledWith({
      id: basicTokenId,
      secret: basicTokenSecret
    });
    expect(response).to.deep.equal(claims);
  });
  it("should not authorize if there is no token", async () => {
    replace(deps, "tokensFromReq", fake.returns({}));
    replace(deps, "validate", fake.returns(claims));

    const error = "some-error";
    const tokenInvalidFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenInvalid: tokenInvalidFake
    });

    try {
      await authenticate({
        req,
        verifyFn
      });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should not authenticate with basic token but no keyClaimsFn", async () => {
    const basicTokenId = "some-basic-id";
    const basicTokenSecret = "some-basic-secret";

    const basicToken = `${basicTokenId}:${basicTokenSecret}`;

    const buffer = Buffer.from(basicToken).toString("base64");

    const basicTokens = {
      basic: buffer
    };

    replace(deps, "tokensFromReq", fake.returns(basicTokens));

    const error = "some-error";
    const tokenInvalidFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenInvalid: tokenInvalidFake
    });

    try {
      await authenticate({
        req,
        verifyFn
      });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
