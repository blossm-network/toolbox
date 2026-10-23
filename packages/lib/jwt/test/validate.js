import assert from "node:assert/strict";
import crypto from "crypto";
import * as chai from "chai";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import chaiDatetime from "chai-datetime";
import { fake, replace, restore, useFakeTimers } from "sinon";
import base64url from "base64url";

import deps from "../deps.js";
import { create, validate } from "../index.js";

const { expect } = chai;

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiDatetime);

let clock;
const now = new Date();

const audience = "some-aud";
const algorithm = "ES256";
const options = {
  issuer: "some-iss",
  subject: "some-sub",
  audience,
  expiresIn: 60,
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
      algorithm,
    });

    const [header, payload, signature] = token.split(".");
    expect(verifyFn).to.have.been.calledWith({
      message: `${header}.${payload}`,
      signature: base64url.toBase64(signature),
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
      algorithm,
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
    const messageFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      message: messageFake,
    });

    try {
      await validate({ token, verifyFn, audience, algorithm });

      //shouldn't get called.
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("The signature is wrong.");
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
      algorithm: "some-bad-algorithm",
    });
    const verifyFn = fake.returns(true);

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      message: messageFake,
    });

    try {
      await validate({ token, verifyFn, audience, algorithm });

      //shouldn't get called.
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "The token algorithm is wrong."
      );
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
        audience: ["some-other-audience", "yet-another-audience"],
      },
      payload,
      signFn: () => sig,
      algorithm,
    });
    const verifyFn = fake.returns(true);

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      message: messageFake,
    });

    try {
      await validate({ token, verifyFn, audience, algorithm });

      //shouldn't get called.
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "The token is intended for a different audience."
      );
      expect(e).to.equal(error);
    }
  });
  it("should throw if token is expired", async () => {
    const sig = "some-signature";
    const token = await create({
      options: {
        ...options,
        expiresIn: -1,
      },
      signFn: () => sig,
    });
    const verifyFn = fake.returns(true);

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      message: messageFake,
    });

    try {
      await validate({ token, verifyFn, audience, algorithm });

      //shouldn't get called.
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("The token is expired.", {
        info: { reason: "expired" },
      });
      expect(e).to.equal(error);
    }
  });
  it("should throw if token is before nbf", async () => {
    const sig = "some-signature";
    const token = await create({
      options: {
        ...options,
        activeIn: 1,
      },
      signFn: () => sig,
    });
    const verifyFn = fake.returns(true);

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      message: messageFake,
    });

    try {
      await validate({ token, verifyFn, audience, algorithm });

      //shouldn't get called.
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "The token isn't active yet."
      );
      expect(e).to.equal(error);
    }
  });
});

describe("Signed token time claims", () => {
  const keys = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const tokenFor = (claims) => {
    const message = [{ alg: algorithm }, claims]
      .map((part) => Buffer.from(JSON.stringify(part)).toString("base64url"))
      .join(".");
    const signature = crypto
      .sign("sha256", Buffer.from(message), keys.privateKey)
      .toString("base64url");
    return `${message}.${signature}`;
  };
  const verifyFn = ({ message, signature }) =>
    crypto.verify(
      "sha256",
      Buffer.from(message),
      keys.publicKey,
      Buffer.from(signature, "base64")
    );
  for (const exp of [undefined, null, "invalid", 1700000000]) {
    it(`rejects invalid legacy expiry ${exp}`, async () => {
      await assert.rejects(
        validate({
          token: tokenFor({ aud: audience, exp }),
          verifyFn,
          audience,
          algorithm,
        }),
        { message: "The token time claim is invalid." }
      );
    });
  }
  it("rejects malformed nbf instead of ignoring it", async () => {
    await assert.rejects(
      validate({
        token: tokenFor({
          aud: audience,
          exp: "9999-01-01T00:00:00.000Z",
          nbf: "invalid",
        }),
        verifyFn,
        audience,
        algorithm,
      }),
      { message: "The token time claim is invalid." }
    );
  });
  it("rejects a token at its exact expiration instant", async () => {
    const clock = useFakeTimers();
    try {
      await assert.rejects(
        validate({
          token: tokenFor({ aud: audience, exp: new Date().toISOString() }),
          verifyFn,
          audience,
          algorithm,
        }),
        { message: "The token is expired." }
      );
    } finally {
      clock.restore();
    }
  });
});
