import assert from "node:assert/strict";
import crypto from "node:crypto";
import { create, validate } from "@blossm/jwt";
import hash from "@blossm/hash";
import mongoose from "mongoose";
import { replace, restore } from "sinon";
import server, { __resetStoresForTest } from "../index.js";
import deps from "../deps.js";

// Use the composed server's actual Mongoose schemas without opening a connection.
describe("Transaction token claims", () => {
  let connection, normalizeTransaction, environment;

  beforeEach(async () => {
    environment = process.env.NODE_ENV;
    process.env.NODE_ENV = "local";
    connection = mongoose.createConnection();
    __resetStoresForTest();
    replace(deps.db, "store", async ({ name, schema, typeKey }) =>
      connection.model(
        name,
        new mongoose.Schema(schema, {
          typeKey,
          autoCreate: false,
          autoIndex: false,
        }),
      ),
    );
    replace(deps, "eventStore", (options) => options);
    const composition = await server({ schema: {} });
    normalizeTransaction = composition.normalizeTransactionFn;
  });

  afterEach(async () => {
    restore();
    __resetStoresForTest();
    await connection.close();
    if (environment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = environment;
  });

  it("preserves actual signed and validated JWT claims before transaction hashing", async () => {
    const keys = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const audience = "test.network";
    const token = await create({
      options: {
        issuer: "test",
        subject: "principal",
        audience,
        expiresIn: 60000,
      },
      signFn: (message) =>
        crypto
          .sign("sha256", Buffer.from(message), keys.privateKey)
          .toString("base64"),
    });
    const claims = await validate({
      token,
      audience,
      algorithm: "ES256",
      verifyFn: ({ message, signature }) =>
        crypto.verify(
          "sha256",
          Buffer.from(message),
          keys.publicKey,
          Buffer.from(signature, "base64"),
        ),
    });
    for (const field of ["exp", "iat", "nbf"])
      assert.equal(typeof claims[field], "string");
    const tx = { id: "authenticated", claims, path: [] };
    const normalized = await normalizeTransaction(tx);
    assert.deepEqual(normalized, tx);
    assert.equal(hash(normalized).create(), hash(tx).create());
    assert.deepEqual(await normalizeTransaction(normalized), normalized);
  });

  it("rejects invalid claim dates through the actual transaction schema", async () => {
    for (const field of ["exp", "iat", "nbf"])
      await assert.rejects(
        normalizeTransaction({ claims: { [field]: "not-a-date" }, path: [] }),
        (error) => {
          assert.equal(error.message, "Invalid transaction metadata.");
          assert(error.cause().errors[`tx.claims.${field}`]);
          return true;
        },
      );
  });

  it("allows claims without optional token dates", async () => {
    const tx = { claims: { sub: "api-key" }, path: [] };
    assert.deepEqual(await normalizeTransaction(tx), tx);
  });
});
