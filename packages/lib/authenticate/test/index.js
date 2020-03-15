const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { string: stringDate } = require("@blossm/datetime");

const deps = require("../deps");

const authorize = require("..");

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
  exp: stringDate()
};

describe("Authorize", () => {
  afterEach(() => {
    restore();
  });
  it("should authentiate", async () => {
    replace(deps, "validate", fake.returns(claims));
    replace(deps, "tokensFromReq", fake.returns(tokens));

    const result = await authorize({
      req,
      verifyFn
    });

    expect(deps.tokensFromReq).to.have.been.calledWith(req);
    expect(deps.validate).to.have.been.calledWith({
      token: bearer,
      verifyFn
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

    const response = await authorize({
      req,
      verifyFn
    });

    expect(deps.tokensFromReq).to.have.been.calledWith(req);
    expect(deps.validate).to.have.been.calledWith({
      token: cookieToken,
      verifyFn
    });
    expect(response).to.deep.equal(claims);
  });
  it("should authenticate with basic token", async () => {
    const basicToken = "some-basic-token";
    const basicTokens = {
      basic: basicToken
    };

    replace(deps, "tokensFromReq", fake.returns(basicTokens));

    const tokenClaimsFnFake = fake.returns(claims);
    const response = await authorize({
      req,
      verifyFn,
      tokenClaimsFn: tokenClaimsFnFake
    });

    expect(deps.tokensFromReq).to.have.been.calledWith(req);
    expect(tokenClaimsFnFake).to.have.been.calledWith({
      header: basicToken
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
      await authorize({
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
