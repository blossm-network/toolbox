const { expect } = require("chai").use(require("chai-as-promised"));

const { unauthorized } = require("@sustainer-network/errors");

const { create, validate } = require("..");

const options = {
  issuer: "some-iss",
  subject: "some-sub",
  audience: "some-aud",
  expiresIn: 60
};

describe("Validate", () => {
  it("it should validate a valid jwt token", async () => {
    const secret = "secret";
    const token = await create({ secret, options });

    const validatedToken = await validate({ token, secret });

    expect(validatedToken).to.exist;
  });

  it("it should validate a valid jwt token with data", async () => {
    const value = "value";
    const payload = { key: value };
    const secret = "secret";
    const token = await create({ payload, secret, options });

    const validatedToken = await validate({ token, secret });

    expect(validatedToken.key).to.equal(value);
  });

  it("it should be expired if the validation time is after the expired time", async () => {
    const secret = "secret";
    const expiresIn = 0;

    const token = await create({
      secret,
      options: { ...options, expiresIn }
    });

    await expect(validate({ token, secret })).to.be.rejectedWith(
      unauthorized.tokenExpired
    );
  });

  it("it should be invalid if the secret is wrong", async () => {
    const signingSecret = "secret";
    const verifyingSecret = "bad";

    const token = await create({
      secret: signingSecret,
      options
    });

    await expect(
      validate({ token, secret: verifyingSecret })
    ).to.be.rejectedWith(unauthorized.tokenInvalid);
  });
});
