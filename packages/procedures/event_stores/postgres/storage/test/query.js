import { expect } from "chai";

import buildQuery from "../src/query.js";

const eventStore = { kind: "events", table: '"public"."events"' };
const snapshotStore = { kind: "snapshots", table: '"public"."snapshots"' };
const countsStore = { kind: "counts", table: '"public"."counts"' };

describe("Postgres event store query", () => {
  it("keeps numeric ordering and range comparisons on typed columns", () => {
    const result = buildQuery({
      store: eventStore,
      query: {
        "headers.root": "root",
        "headers.number": { $gt: 9, $lte: 100 },
        "headers.created": { $gte: "2026-10-22T00:00:00.000Z" },
      },
      sort: { "headers.number": 1 },
      limit: 100,
    });
    expect(result.text).to.equal(
      'SELECT doc FROM "public"."events" WHERE root = $1 AND number > $2 AND number <= $3 AND created >= $4 ORDER BY number ASC LIMIT $5'
    );
    expect(result.values).to.deep.equal([
      "root",
      9,
      100,
      "2026-10-22T00:00:00.000Z",
      100,
    ]);
  });

  it("keeps path names and scalar values out of SQL", () => {
    const path = 'payload.name"; DROP TABLE events; --';
    const value = '" OR true; DROP TABLE events; --';
    const result = buildQuery({ store: eventStore, query: { [path]: value } });
    expect(result.text).to.equal(
      'SELECT doc FROM "public"."events" WHERE doc @? $1::jsonpath'
    );
    expect(result.values).to.deep.equal([
      `lax $."payload".${JSON.stringify(
        path.slice("payload.".length)
      )} ? (@ == ${JSON.stringify(value)})`,
    ]);
  });

  it("uses lax traversal for scalar equality through arrays", () => {
    for (const value of [false, 0, "member"])
      expect(
        buildQuery({
          store: snapshotStore,
          query: { "state.members.name": value },
        }).values
      ).to.deep.equal([
        `lax $."state"."members"."name" ? (@ == ${JSON.stringify(value)})`,
      ]);
  });

  it("gives null its explicit-null or missing-path meaning", () => {
    const result = buildQuery({
      store: eventStore,
      query: { "payload.name": null },
    });
    expect(result.text).to.include(
      "doc @? $1::jsonpath OR NOT jsonb_path_exists(doc, $2::jsonpath)"
    );
    expect(result.values).to.deep.equal([
      'lax $."payload"."name" ? (@ == null)',
      'lax $."payload"."name"',
    ]);
  });

  it("compares entire JSON objects/arrays rather than JSON containment", () => {
    for (const value of [{ name: "member" }, [1, 2]]) {
      const result = buildQuery({
        store: eventStore,
        query: { "payload.value": value },
      });
      expect(result.text).to.include("matched.value = $2::jsonb");
      expect(result.text).to.include("element.value = $2::jsonb");
      expect(result.text).not.to.include("@>");
      expect(result.values).to.deep.equal([
        'lax $."payload"."value"',
        JSON.stringify(value),
      ]);
    }
  });

  it("supports counts ordering and snapshot event exclusion", () => {
    expect(
      buildQuery({ store: countsStore, sort: { updated: -1, root: 1 } }).text
    ).to.equal(
      'SELECT root, value, updated FROM "public"."counts" ORDER BY updated DESC, root ASC'
    );
    expect(
      buildQuery({ store: snapshotStore, select: { events: 0 } }).text
    ).to.equal('SELECT doc FROM "public"."snapshots"');
  });

  it("rejects unsupported query grammar instead of ignoring it", () => {
    for (const query of [
      { $or: [] },
      { toString: "value" },
      { "headers.action": "registered" },
      { "headers.number": { $in: [1, 2] } },
      { "headers.number": {} },
      { "headers.root": { $gt: "a" } },
      { "payload.count": { $gt: 2 } },
      { "payload.count": undefined },
      { "payload.$where": "x" },
      { "payload..name": "x" },
      { "state.name": "x" },
    ])
      expect(() => buildQuery({ store: eventStore, query })).to.throw(
        TypeError
      );
  });

  it("rejects unsupported sorting and projection grammar", () => {
    for (const options of [
      { sort: { "payload.name": 1 } },
      { sort: { "headers.number": "DESC" } },
      { sort: { toString: 1 } },
      { select: { hash: 1 } },
    ])
      expect(() => buildQuery({ store: eventStore, ...options })).to.throw(
        TypeError
      );
  });
});
