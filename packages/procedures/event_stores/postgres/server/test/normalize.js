import assert from "node:assert/strict";
import hash from "@blossm/hash";
import normalize from "../normalize.js";

const schema = {
  name: "String",
  count: { type: "Number", required: true, default: 3 },
  when: "Date",
  flag: "Boolean",
  free: "Object",
  tags: ["String"],
  items: [{ code: "String", quantity: "Number" }],
  nested: { label: "String" },
};

const rejection = (message, path) => (error) => {
  assert.equal(error.statusCode, 400);
  assert.equal(error.message, message);
  if (path) assert(error.cause().errors[path], `expected an error at ${path}`);
  return true;
};

describe("Postgres event store schema normalization", () => {
  it("casts and strips payloads with Mongoose semantics, returning plain JSON", async () => {
    const { normalizePayloadFn } = normalize(schema);
    const payload = await normalizePayloadFn({
      name: 5,
      count: "7",
      when: "2026-01-01",
      flag: "true",
      free: { anything: [1, { deep: null }] },
      tags: [1, 2],
      items: [{ code: 9, quantity: "2", undeclared: true }],
      nested: { label: 1, undeclared: true },
      undeclared: true,
    });
    assert.deepEqual(payload, {
      name: "5",
      count: 7,
      when: "2026-01-01T00:00:00.000Z",
      flag: true,
      free: { anything: [1, { deep: null }] },
      tags: ["1", "2"],
      items: [{ code: "9", quantity: 2 }],
      nested: { label: "1" },
    });
    // The representation is already JSON and stable, so its hash survives JSONB.
    assert.deepEqual(JSON.parse(JSON.stringify(payload)), payload);
    assert.deepEqual(await normalizePayloadFn(payload), payload);
  });

  it("neither requires nor defaults event payload fields, as in the Mongo event store", async () => {
    const { normalizePayloadFn } = normalize(schema);
    assert.deepEqual(await normalizePayloadFn({}), {});
    assert.deepEqual(await normalizePayloadFn({ name: "only" }), {
      name: "only",
    });
  });

  it("rejects payloads that cannot be cast or are not objects", async () => {
    const { normalizePayloadFn } = normalize(schema);
    await assert.rejects(
      normalizePayloadFn({ count: "many" }),
      rejection("Invalid event payload.", "payload.count"),
    );
    await assert.rejects(
      normalizePayloadFn({ items: [{ quantity: "few" }] }),
      rejection("Invalid event payload."),
    );
    for (const payload of [null, "text", 5, false, [{}]])
      await assert.rejects(
        normalizePayloadFn(payload),
        rejection("Invalid event payload."),
      );
  });

  it("leaves payloads and state raw when no fields are declared", () => {
    for (const absent of [undefined, {}])
      assert.deepEqual(Object.keys(normalize(absent)), [
        "normalizeTransactionFn",
      ]);
  });

  it("fails closed on schemas JSONB cannot represent or Mongoose cannot build", () => {
    for (const unsupported of [
      { id: "ObjectId" },
      { bytes: "Buffer" },
      { bytes: ["Buffer"] },
      { amount: "Decimal128" },
      { big: "BigInt" },
      { lookup: "Map" },
      { id: "UUID" },
      { nested: { id: "ObjectId" } },
      { items: [{ amount: "Decimal128" }] },
    ])
      assert.throws(
        () => normalize(unsupported),
        (error) =>
          error instanceof TypeError &&
          /^Unsupported PostgreSQL event-store schema type at /.test(
            error.message,
          ),
        JSON.stringify(unsupported),
      );
    assert.throws(() => normalize({ name: "NotAType" }), /not a valid type/);
    for (const invalid of [null, [], "String", 5])
      assert.throws(() => normalize(invalid), /schema must be an object/);
  });

  it("accepts snapshot state only when it already equals its schema representation", async () => {
    const { normalizePayloadFn, assertStateFn } = normalize(schema);
    const state = await normalizePayloadFn({
      name: "bicycle",
      count: "2",
      when: "2026-01-01",
      items: [{ code: "basket" }],
    });
    await assertStateFn(state);
    // Key order is not part of the canonical commitment.
    await assertStateFn(Object.fromEntries(Object.entries(state).reverse()));
    for (const drifted of [
      { ...state, count: "2" },
      { ...state, undeclared: true },
      { ...state, when: "2026-01-01" },
    ])
      await assert.rejects(
        assertStateFn(drifted),
        rejection("Snapshot state does not match its declared schema."),
      );
    // State keeps required fields, as in the Mongo snapshot store.
    const { count: _, ...missing } = state;
    await assert.rejects(
      assertStateFn(missing),
      rejection("Invalid snapshot state.", "state.count"),
    );
  });

  it("normalizes transaction metadata to the representation committed by tHash", async () => {
    const { normalizeTransactionFn } = normalize();
    const tx = {
      id: "authenticated",
      ip: "127.0.0.1",
      claims: {
        iss: "issuer",
        aud: ["a", "b"],
        sub: "principal",
        exp: "2026-01-01T00:01:00.000Z",
        iat: "2026-01-01T00:00:00.000Z",
        nbf: "2026-01-01T00:00:00.000Z",
        context: { session: { root: "session" } },
      },
      path: [
        {
          name: "register",
          network: "network",
          host: "host",
          procedure: "command",
          hash: "hash",
          issued: "2026-01-01T00:00:00.000Z",
          timestamp: "2026-01-01T00:00:00.000Z",
          extra: { kept: true },
        },
      ],
    };
    const normalized = await normalizeTransactionFn(tx);
    assert.deepEqual(normalized, tx);
    assert.equal(hash(normalized).create(), hash(tx).create());
    assert.deepEqual(await normalizeTransactionFn(normalized), normalized);

    assert.deepEqual(
      await normalizeTransactionFn({
        id: 123,
        claims: { sub: "api-key", exp: "2026-01-01T00:00:00Z" },
        path: [],
        undeclared: true,
      }),
      {
        id: "123",
        claims: { sub: "api-key", exp: "2026-01-01T00:00:00.000Z" },
        path: [],
      },
    );
    assert.deepEqual(await normalizeTransactionFn({ path: [] }), { path: [] });
  });

  it("rejects invalid transaction metadata", async () => {
    const { normalizeTransactionFn } = normalize(schema);
    for (const field of ["exp", "iat", "nbf"])
      await assert.rejects(
        normalizeTransactionFn({ claims: { [field]: "not-a-date" }, path: [] }),
        rejection("Invalid transaction metadata.", `tx.claims.${field}`),
      );
    await assert.rejects(
      normalizeTransactionFn({ claims: { aud: [1] }, path: [] }),
      rejection("Invalid transaction metadata.", "tx.claims.aud"),
    );
    await assert.rejects(
      normalizeTransactionFn({ path: [{ network: "network" }] }),
      rejection("Invalid transaction metadata.", "tx.path.0.hash"),
    );
  });

  it("keeps separate stores' models independent of each other and of global Mongoose", async () => {
    const first = normalize({ value: "Number" });
    const second = normalize({ value: "String" });
    assert.deepEqual(await first.normalizePayloadFn({ value: "1" }), {
      value: 1,
    });
    assert.deepEqual(await second.normalizePayloadFn({ value: 1 }), {
      value: "1",
    });
  });
});
