import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiDatetime from "chai-datetime";
import { fake, replace, restore, useFakeTimers } from "sinon";
import base64url from "base64url";

import deps from "../deps.js";
import { create, validate } from "../index.js";

const { expect } = chai;

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
