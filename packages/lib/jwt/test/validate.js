const { expect } = require("chai").use(require("chai-as-promised"));
const { fake, replace } = require("sinon");

const deps = require("../deps");

const { create, validate } = require("..");

const options = {
  issuer: "some-iss",
  subject: "some-sub",
  audience: "some-aud",
  expiresIn: 60
};

describe("Validate", () => {
  it("it should validate a valid jwt token", async () => {
    const sig = "some-signature";
    const token = await create({ options, signFn: () => sig });
    const verifyFn = fake.returns(true);
    const validatedToken = await validate({ token, verifyFn });

    const [header, payload, signature] = token.split(".");
    expect(verifyFn).to.have.been.calledWith({
      message: `${header}.${payload}`,
      signature
    });
    expect(validatedToken).to.deep.equal(deps.decodeJwt(token));
  });
  it("it should validate a valid jwt token with data", async () => {
    const value = "value";
    const payload = { key: value };
    const sig = "some-signature";
    const token = await create({ options, payload, signFn: () => sig });
    const verifyFn = fake.returns(true);
    const validatedToken = await validate({ token, verifyFn });
    expect(validatedToken.key).to.equal(value);
  });
  it("it should be invalid if the secret is wrong", async () => {
    const value = "value";
    const payload = { key: value };
    const sig = "some-signature";
    const token = await create({ options, payload, signFn: () => sig });
    const verifyFn = fake.returns(false);

    const error = "some-error";
    const tokenInvalidFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenInvalid: tokenInvalidFake
    });

    try {
      await validate({ token, verifyFn });

      //shouldn't get called.
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
