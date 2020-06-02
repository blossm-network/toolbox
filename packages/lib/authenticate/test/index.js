const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { string: dateString } = require("@blossm/datetime");

const deps = require("../deps");

const authenticate = require("..");

const verifyFn = "some-verify-fn";

const basicTokenId = "some-basic-id";
const basicTokenSecret = "some-basic-secret";

const basicToken = `${basicTokenId}:${basicTokenSecret}`;

const buffer = Buffer.from(basicToken).toString("base64");

const claims = {
  exp: dateString(),
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

    const jwt = "some-jwt";
    const result = await authenticate({
      jwt,
      verifyFn,
      audience,
      algorithm,
    });

    expect(deps.validate).to.have.been.calledWith({
      token: jwt,
      verifyFn,
      audience,
      algorithm,
    });
    expect(result).to.deep.equal(claims);
  });
  it("should authenticate with basic token", async () => {
    const keyClaimsFnFake = fake.returns(claims);
    const response = await authenticate({
      basic: buffer,
      keyClaimsFn: keyClaimsFnFake,
    });

    expect(keyClaimsFnFake).to.have.been.calledWith({
      id: basicTokenId,
      secret: basicTokenSecret,
    });
    expect(response).to.deep.equal(claims);
  });
  it("should not authorize if there is no token", async () => {
    replace(deps, "validate", fake.returns(claims));

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      message: messageFake,
    });

    try {
      await authenticate({
        verifyFn,
      });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("Token not found.");
      expect(e).to.equal(error);
    }
  });
  it("should not authenticate with basic token but no keyClaimsFn", async () => {
    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      message: messageFake,
    });

    try {
      await authenticate({
        verifyFn,
        basic: buffer,
      });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("Token not found.");
      expect(e).to.equal(error);
    }
  });
});
