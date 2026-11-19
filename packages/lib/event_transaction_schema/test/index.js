import assert from "node:assert/strict";
import { Mongoose } from "mongoose";
import transactionSchema from "../index.js";

// Real Mongoose models, validated without opening a connection.
describe("Event transaction schema", () => {
  const mongoose = new Mongoose();
  const Model = mongoose.model(
    "Transaction",
    new mongoose.Schema(
      { tx: { type: transactionSchema(mongoose.Schema) } },
      { _id: false, autoCreate: false, autoIndex: false },
    ),
  );
  const normalize = async (tx) => {
    const document = new Model({ tx });
    await document.validate();
    return document.toObject({ minimize: false }).tx;
  };
  const step = {
    network: "some.network",
    host: "some.host",
    procedure: "some-procedure",
    hash: "some-hash",
  };

  it("normalizes dates to ISO strings and keeps the declared shape", async () => {
    const date = new Date("2026-01-02T03:04:05.006Z");
    const iso = date.toISOString();
    assert.deepEqual(
      await normalize({
        ip: "1.2.3.4",
        id: "some-id",
        dropped: "undeclared",
        claims: {
          iss: "issuer",
          aud: ["a", "b"],
          sub: "subject",
          exp: date,
          iat: date.getTime(),
          nbf: iso,
          jti: "some-jti",
          custom: { empty: {} },
        },
        path: [{ ...step, issued: date, timestamp: iso, extra: 1 }],
      }),
      {
        ip: "1.2.3.4",
        id: "some-id",
        claims: {
          iss: "issuer",
          aud: ["a", "b"],
          sub: "subject",
          exp: iso,
          iat: iso,
          nbf: iso,
          jti: "some-jti",
          custom: { empty: {} },
        },
        path: [{ ...step, issued: iso, timestamp: iso, extra: 1 }],
      },
    );
  });

  it("leaves absent optional fields absent", async () => {
    assert.deepEqual(await normalize({ id: "some-id" }), { id: "some-id" });
    assert.deepEqual(await normalize({ claims: { aud: "a" }, path: [] }), {
      claims: { aud: "a" },
      path: [],
    });
  });

  it("rejects invalid dates, audiences and incomplete path entries", async () => {
    const rejects = (tx, path) =>
      assert.rejects(normalize(tx), (error) => {
        assert(error.errors[path], `expected an error at ${path}`);
        return true;
      });
    for (const field of ["exp", "iat", "nbf"])
      await rejects(
        { claims: { [field]: "not-a-date" } },
        `tx.claims.${field}`,
      );
    for (const aud of [1, ["a", 1], { a: 1 }])
      await rejects({ claims: { aud } }, "tx.claims.aud");
    for (const field of ["issued", "timestamp"])
      await rejects(
        { path: [{ ...step, [field]: "not-a-date" }] },
        `tx.path.0.${field}`,
      );
    for (const field of Object.keys(step))
      await rejects(
        { path: [{ ...step, [field]: undefined }] },
        `tx.path.0.${field}`,
      );
  });
});
