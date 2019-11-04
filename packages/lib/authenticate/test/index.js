const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

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
const claims = "some-claims";

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
  it("should not authorize if there is no token", async () => {
    replace(deps, "tokensFromReq", fake.returns({}));
    replace(deps, "validate", fake.returns(claims));

    try {
      await authorize({
        req,
        verifyFn
      });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e.statusCode).to.equal(401);
      expect(e.message).to.equal("Invalid token");
    }
  });

  it("should authorize with no token and not strict", async () => {
    replace(deps, "tokensFromReq", fake.returns({}));
    replace(deps, "validate", fake.returns(claims));

    const result = await authorize({
      req,
      verifyFn,
      requiresToken: false
    });

    expect(result).to.deep.equal({});
  });
});
