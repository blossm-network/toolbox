const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("chai-as-promised"));
const { fake, replace, restore, useFakeTimers } = require("sinon");
const base64url = require("base64url");

const deps = require("../deps");

let clock;
const now = new Date();

const { create, validate } = require("..");

const audience = "some-aud";
const algorithm = "ES256";
const options = {
  issuer: "some-iss",
  subject: "some-sub",
  audience,
  expiresIn: 60
};

describe("Validate", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("it should validate a valid jwt token", async () => {
    const sig = "some-signature";
    const token = await create({ options, signFn: () => sig });
    const verifyFn = fake.returns(true);
    const validatedClaims = await validate({
      token,
      verifyFn,
      audience,
      algorithm
    });

    const [header, payload, signature] = token.split(".");
    expect(verifyFn).to.have.been.calledWith({
      message: `${header}.${payload}`,
      signature: base64url.toBase64(signature)
    });
    expect(validatedClaims).to.exist;
  });
  it("it should validate a valid jwt token with data", async () => {
    const value = "value";
    const payload = { key: value };
    const sig = "some-signature";
    const token = await create({ options, payload, signFn: () => sig });
    const verifyFn = fake.returns(true);
    const validatedToken = await validate({
      token,
      verifyFn,
      audience,
      algorithm
    });
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
      await validate({ token, verifyFn, audience, algorithm });

      //shouldn't get called.
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("it should be invalid if the algorithm is wrong", async () => {
    const value = "value";
    const payload = { key: value };
    const sig = "some-signature";
    const token = await create({
      options,
      payload,
      signFn: () => sig,
      algorithm: "some-bad-algorithm"
    });
    const verifyFn = fake.returns(true);

    const error = "some-error";
    const tokenInvalidFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenInvalid: tokenInvalidFake
    });

    try {
      await validate({ token, verifyFn, audience, algorithm });

      //shouldn't get called.
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("it should be invalid if the audience is wrong", async () => {
    const value = "value";
    const payload = { key: value };
    const sig = "some-signature";
    const token = await create({
      options: {
        ...options,
        audience: ["some-other-audience", "yet-another-audience"]
      },
      payload,
      signFn: () => sig,
      algorithm
    });
    const verifyFn = fake.returns(true);

    const error = "some-error";
    const wrongAudienceFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      wrongAudience: wrongAudienceFake
    });

    try {
      await validate({ token, verifyFn, audience, algorithm });

      //shouldn't get called.
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw if token is expired", async () => {
    const sig = "some-signature";
    const token = await create({
      options: {
        ...options,
        expiresIn: -1
      },
      signFn: () => sig
    });
    const verifyFn = fake.returns(true);

    const error = "some-error";
    const tokenExpiredFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenExpired: tokenExpiredFake
    });

    try {
      await validate({ token, verifyFn, audience, algorithm });

      //shouldn't get called.
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw if token is before nbf", async () => {
    const sig = "some-signature";
    const token = await create({
      options: {
        ...options,
        activeIn: 1
      },
      signFn: () => sig
    });
    const verifyFn = fake.returns(true);

    const error = "some-error";
    const tokenNotAtiveFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenNotActive: tokenNotAtiveFake
    });

    try {
      await validate({ token, verifyFn, audience, algorithm });

      //shouldn't get called.
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
