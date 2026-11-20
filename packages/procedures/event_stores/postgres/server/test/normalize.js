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

  const deep = {
    title: { type: "String", required: true, default: "untitled" },
    owner: {
      name: "String",
      tags: ["String"],
      address: { city: "String", moved: "Date", geo: { lat: "Number" } },
    },
    lines: [
      { sku: "String", subject: { root: "String" }, parts: [{ n: "Number" }] },
    ],
  };

  it("casts and strips at every depth, materializing only the empties below a submitted object", async () => {
    const { normalizePayloadFn } = normalize(deep);
    const payload = await normalizePayloadFn({
      owner: {
        name: 1,
        tags: [2],
        address: {
          city: 3,
          moved: "2026-01-01",
          geo: { lat: "4.5", undeclared: true },
          undeclared: true,
        },
        undeclared: true,
      },
      lines: [
        {
          sku: 5,
          subject: { root: 6, undeclared: true },
          parts: [{ n: "7", undeclared: true }],
        },
      ],
    });
    assert.deepEqual(payload, {
      owner: {
        name: "1",
        tags: ["2"],
        address: {
          city: "3",
          moved: "2026-01-01T00:00:00.000Z",
          geo: { lat: 4.5 },
        },
      },
      lines: [{ sku: "5", subject: { root: "6" }, parts: [{ n: 7 }] }],
    });
    assert.deepEqual(await normalizePayloadFn(payload), payload);

    // Nothing is invented for an omitted top-level field, required or defaulted.
    assert.deepEqual(await normalizePayloadFn({}), {});
    // Below a submitted object, Mongoose adds declared arrays and nested
    // objects as empties. They are part of what is hashed and stored.
    const sparse = await normalizePayloadFn({ owner: {}, lines: [{}] });
    assert.deepEqual(sparse, {
      owner: { tags: [], address: { geo: {} } },
      lines: [{ subject: {}, parts: [] }],
    });
    assert.deepEqual(await normalizePayloadFn(sparse), sparse);
    // Null is kept, and a single object is wrapped into its declared array.
    assert.deepEqual(
      await normalizePayloadFn({
        owner: { address: null },
        lines: { sku: "one" },
      }),
      {
        owner: { tags: [], address: null },
        lines: [{ sku: "one", subject: {}, parts: [] }],
      },
    );
  });

  it("rejects a wrong shape or uncastable value at any depth instead of dropping it", async () => {
    const { normalizePayloadFn } = normalize(deep);
    for (const [payload, path] of [
      [{ owner: { address: { geo: { lat: "north" } } } }],
      [{ owner: { address: { moved: "someday" } } }],
      [{ lines: [{ parts: [{ n: "few" }] }] }],
      [{ owner: "text" }, "payload.owner"],
      [{ lines: "text" }, "payload.lines"],
      // Mongoose alone would drop these declared fields without an error.
      [{ owner: { address: "text" } }],
      [{ owner: { address: [{}] } }],
      [{ owner: { address: { geo: 0 } } }],
      [{ lines: [{ subject: "text" }] }],
      [{ lines: [[{ sku: "nested" }]] }],
      [{ lines: [{ parts: [[{ n: 1 }]] }] }],
    ])
      await assert.rejects(
        normalizePayloadFn(payload),
        rejection("Invalid event payload.", path),
        JSON.stringify(payload),
      );
  });

  it("rejects non-finite numbers rather than storing them as null", async () => {
    const { normalizePayloadFn, assertStateFn } = normalize({
      count: "Number",
      free: "Object",
    });
    // JSON.parse("1e400") is Infinity, so a request body can carry one.
    for (const payload of [
      { count: "Infinity" },
      { count: JSON.parse("1e400") },
      { free: { deep: [-Infinity] } },
    ])
      await assert.rejects(
        normalizePayloadFn(payload),
        rejection("Invalid event payload."),
      );
    await assert.rejects(
      assertStateFn({ count: Infinity }),
      rejection("Invalid snapshot state."),
    );
    assert.deepEqual(await normalizePayloadFn({ count: "1e308" }), {
      count: 1e308,
    });
  });

  it("requires snapshot state to equal its cast form at every depth, including nested empties", async () => {
    const { assertStateFn } = normalize(deep);
    const state = {
      title: "bicycle",
      owner: { tags: [], address: { geo: {} } },
      lines: [{ sku: "5", subject: {}, parts: [] }],
    };
    await assertStateFn(state);
    await assertStateFn({ title: "bicycle" });
    // A top-level default never fills in a required field.
    await assert.rejects(
      assertStateFn({ owner: state.owner }),
      rejection("Invalid snapshot state.", "state.title"),
    );
    for (const drifted of [
      { ...state, owner: {} },
      { ...state, owner: { ...state.owner, address: { geo: { lat: "4" } } } },
      { ...state, lines: [{ sku: "5", subject: {} }] },
      { ...state, lines: [{ ...state.lines[0], parts: [{ n: 1, x: 2 }] }] },
    ])
      await assert.rejects(
        assertStateFn(drifted),
        rejection("Snapshot state does not match its declared schema."),
        JSON.stringify(drifted),
      );
    await assert.rejects(
      assertStateFn({ ...state, owner: { ...state.owner, address: "text" } }),
      rejection("Invalid snapshot state."),
    );

    // Required containers bind state but, like every payload field, not events.
    const required = normalize({
      list: { type: ["Number"], required: true },
      box: { type: { label: "String" }, required: true },
    });
    assert.deepEqual(await required.normalizePayloadFn({}), {});
    await required.assertStateFn({ list: [], box: {} });
    for (const [missing, path] of [
      [{ box: {} }, "state.list"],
      [{ list: [] }, "state.box"],
    ])
      await assert.rejects(
        required.assertStateFn(missing),
        rejection("Invalid snapshot state.", path),
      );
  });

  it("fails closed at any depth on unsupported types, arrays of arrays and field options below the top level", () => {
    for (const unsupported of [
      { a: { b: { c: "ObjectId" } } },
      { a: { b: ["UUID"] } },
      { a: [{ b: [{ c: "Buffer" }] }] },
      { a: [{ b: ["ObjectId"] }] },
      { a: { type: ["Decimal128"] } },
      { a: { type: [{ b: "BigInt" }] } },
      { a: { type: { b: "ObjectId" } } },
      { a: { type: "Map", of: "String" } },
      // Mongoose 9 types that cast to BSON wrappers, not JSON numbers.
      { a: "Int32" },
      { a: "Double" },
      // The shared formatter would turn the inner array into an object.
      { a: [["Number"]] },
      { a: { type: [["Number"]] } },
      { a: { b: [["Number"]] } },
      { a: [{ b: [[{ c: "String" }]] }] },
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
    // The shared formatter reads `type`, `required` and `default` only on
    // top-level fields. Deeper, Mongoose takes them for field names and
    // refuses their values as types.
    for (const nestedOptions of [
      { a: { b: { type: "String", required: true } } },
      { a: { b: { type: "Number", default: 4 } } },
      { a: [{ b: { type: "String", required: true } }] },
      { a: { type: [{ b: { type: "Number", default: 1 } }] } },
    ])
      assert.throws(
        () => normalize(nestedOptions),
        /is not a valid type at path/,
        JSON.stringify(nestedOptions),
      );
    // Elements without a declared type stay raw JSON.
    for (const supported of [{ a: [] }, { a: ["Object"] }, { a: "Mixed" }])
      normalize(supported);
  });

  it("reads nested arrays in top-level field options as data, not type declarations", async () => {
    // The top-level default is suppressed, so it is never applied or cast.
    const defaulted = normalize({
      free: { type: "Object", default: [[1]] },
      count: "Number",
    });
    assert.deepEqual(await defaulted.normalizePayloadFn({ count: "2" }), {
      count: 2,
    });
    assert.deepEqual(
      await defaulted.normalizePayloadFn({ free: [[3]], extra: true }),
      { free: [[3]] },
    );
    await defaulted.assertStateFn({ count: 2 });
    await defaulted.assertStateFn({ free: [[3]] });

    // Mixed has no enum validator: the value stays raw JSON.
    const listed = normalize({
      free: { type: "Object", enum: [[[1]], [[2]]] },
      count: "Number",
    });
    for (const free of [[[1]], [[9]], { any: "thing" }])
      assert.deepEqual(
        await listed.normalizePayloadFn({ free, count: "2", extra: true }),
        { free, count: 2 },
      );
    await listed.assertStateFn({ free: [[2]], count: 2 });

    // The declared type beside those options is still inspected.
    for (const unsupported of [
      { a: { type: [["Number"]], default: [[1]] } },
      { a: { type: { b: [["Number"]] }, default: {} } },
      // A `type` holding a `type` declares a nested object, so its siblings
      // are field declarations.
      { a: { type: { type: "String" }, b: [["Number"]] } },
    ])
      assert.throws(
        () => normalize(unsupported),
        /^TypeError: Unsupported PostgreSQL event-store schema type at .*array of arrays\.$/,
        JSON.stringify(unsupported),
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
