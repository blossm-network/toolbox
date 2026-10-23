import assert from "node:assert/strict";
import crypto from "crypto";
import { useFakeTimers } from "sinon";
import { create, decode, validate } from "../index.js";

const keys = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const audience = "example.test";
const algorithm = "ES256";
const signFn = (message) =>
  crypto
    .sign("sha256", Buffer.from(message), keys.privateKey)
    .toString("base64");
const verifyFn = ({ message, signature }) =>
  crypto.verify(
    "sha256",
    Buffer.from(message),
    keys.publicKey,
    Buffer.from(signature, "base64")
  );
const standardToken = (claims) => {
  const message = [{ alg: algorithm, typ: "JWT" }, claims]
    .map((part) => Buffer.from(JSON.stringify(part)).toString("base64url"))
    .join(".");
  const signature = crypto
    .sign("sha256", Buffer.from(message), {
      key: keys.privateKey,
      dsaEncoding: "ieee-p1363",
    })
    .toString("base64url");
  return `${message}.${signature}`;
};

describe("Opt-in JOSE wire format", () => {
  it("creates standard claims and P1363 signatures from a DER signing callback", async () => {
    const clock = useFakeTimers(1700000000000);
    try {
      const token = await create({
        options: {
          issuer: audience,
          subject: "user",
          audience: [audience, "other"],
          expiresIn: 1000,
        },
        signFn,
        format: "jose",
      });
      const { claims } = decode(token);
      assert.deepEqual(claims.aud, [audience, "other"]);
      assert.equal(claims.exp, 1700000001);
      assert.equal(claims.nbf, 1700000000);
      assert.equal(claims.iat, 1700000000);
      const [header, payload, signature] = token.split(".");
      assert.equal(Buffer.from(signature, "base64url").length, 64);
      assert.equal(
        crypto.verify(
          "sha256",
          Buffer.from(`${header}.${payload}`),
          {
            key: keys.publicKey,
            dsaEncoding: "ieee-p1363",
          },
          Buffer.from(signature, "base64url")
        ),
        true
      );
      assert.deepEqual(
        await validate({
          token,
          audience,
          algorithm,
          verifyFn,
          format: "jose",
        }),
        claims
      );
    } finally {
      clock.restore();
    }
  });
  it("verifies independently encoded standard tokens through the existing DER verifier callback", async () => {
    const claims = { aud: [audience, "other"], exp: Date.now() / 1000 + 60 };
    assert.deepEqual(
      await validate({
        token: standardToken(claims),
        audience,
        algorithm,
        verifyFn,
        format: "jose",
      }),
      claims
    );
  });
  it("rejects expired NumericDate tokens", async () => {
    await assert.rejects(
      validate({
        token: standardToken({ aud: audience, exp: 1700000000 }),
        audience,
        algorithm,
        verifyFn,
        format: "jose",
      }),
      { message: "The token is expired." }
    );
  });
  it("does not interpret ISO dates as standard NumericDate", async () => {
    await assert.rejects(
      validate({
        token: standardToken({
          aud: audience,
          exp: "9999-01-01T00:00:00.000Z",
        }),
        audience,
        algorithm,
        verifyFn,
        format: "jose",
      }),
      { message: "The token time claim is invalid." }
    );
  });
  it("requires a valid standard audience string or array", async () => {
    await assert.rejects(
      validate({
        token: standardToken({
          aud: [audience, 42],
          exp: Date.now() / 1000 + 60,
        }),
        audience,
        algorithm,
        verifyFn,
        format: "jose",
      }),
      { message: "The token is intended for a different audience." }
    );
  });
  it("enforces activation and signature validity for standard tokens", async () => {
    await assert.rejects(
      validate({
        token: standardToken({
          aud: audience,
          exp: Date.now() / 1000 + 60,
          nbf: Date.now() / 1000 + 30,
        }),
        audience,
        algorithm,
        verifyFn,
        format: "jose",
      }),
      { message: "The token isn't active yet." }
    );
    const token = standardToken({ aud: audience, exp: Date.now() / 1000 + 60 });
    const [header, payload, signature] = token.split(".");
    const changedPayload = Buffer.from(
      JSON.stringify({ aud: audience, exp: Date.now() / 1000 + 3600 })
    ).toString("base64url");
    await assert.rejects(
      validate({
        token: `${header}.${changedPayload}.${signature}`,
        audience,
        algorithm,
        verifyFn,
        format: "jose",
      }),
      { message: "The signature is wrong." }
    );
    await assert.rejects(
      validate({
        token: `${header}.${payload}.invalid`,
        audience,
        algorithm,
        verifyFn,
        format: "jose",
      }),
      { message: "The token signature encoding is invalid." }
    );
  });
  it("rejects noncanonical JOSE signatures instead of ignoring extra characters", async () => {
    const token = standardToken({ aud: audience, exp: Date.now() / 1000 + 60 });
    const [header, payload, signature] = token.split(".");
    const alphabet =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const unusedBits =
      signature.slice(0, -1) +
      alphabet[alphabet.indexOf(signature.slice(-1)) + 1];
    for (const altered of [signature + "!!", signature + "=", unusedBits]) {
      await assert.rejects(
        validate({
          token: `${header}.${payload}.${altered}`,
          audience,
          algorithm,
          verifyFn,
          format: "jose",
        }),
        { message: "The token signature encoding is invalid." }
      );
    }
  });
  it("limits the opt-in codec to supported ECDSA algorithms", async () => {
    await assert.rejects(
      create({ options: {}, signFn, format: "jose", algorithm: "RS256" }),
      { message: "Unsupported JOSE signing algorithm." }
    );
  });
  it("rejects unknown format choices before signing or verification", async () => {
    await assert.rejects(create({ options: {}, signFn, format: "guess" }), {
      message: "Unsupported token format.",
    });
    await assert.rejects(
      validate({
        token: "invalid",
        audience,
        algorithm,
        verifyFn,
        format: "guess",
      }),
      { message: "Unsupported token format." }
    );
  });
  it("requires exactly three segments instead of accepting suffixes", async () => {
    const token = await create({
      options: { audience, expiresIn: 60000 },
      signFn,
    });
    await assert.rejects(
      validate({ token: `${token}.extra`, audience, algorithm, verifyFn }),
      { message: "The token format is invalid." }
    );
  });
});
