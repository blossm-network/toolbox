import { expect } from "chai";

import { columns, encode, decode } from "../src/document.js";

const headers = {
  nonce: "root_0",
  root: "root",
  number: 0,
  created: "2026-10-22T00:00:00.000Z",
};

describe("Postgres event store documents", () => {
  it("keeps normalized event bodies intact without date coercion", () => {
    const document = {
      hash: "hash",
      headers: { ...headers, idempotency: "id" },
      payload: { name: "member" },
    };
    const values = encode({ kind: "events", document });
    expect(columns("events")).to.deep.equal([
      "hash",
      "nonce",
      "root",
      "number",
      "created",
      "idempotency",
      "doc",
    ]);
    expect(values.slice(0, -1)).to.deep.equal([
      "hash",
      "root_0",
      "root",
      0,
      headers.created,
      "id",
    ]);
    expect(JSON.parse(values.at(-1))).to.deep.equal(document);
    expect(decode({ kind: "events", row: { doc: document } })).to.deep.equal(
      document
    );
  });

  it("stores snapshot bytes outside JSON and restores the same Buffer", () => {
    const events = Buffer.from([0, 1, 255]);
    const document = {
      hash: "hash",
      headers,
      state: { active: false },
      events,
    };
    const values = encode({ kind: "snapshots", document });
    const doc = JSON.parse(values.at(-2));
    expect(doc).not.to.have.property("events");
    expect(values.at(-1)).to.equal(events);
    expect(document.events).to.equal(events);
    expect(decode({ kind: "snapshots", row: { doc, events } })).to.deep.equal(
      document
    );
    expect(
      decode({ kind: "snapshots", row: { doc }, select: { events: 0 } })
    ).to.deep.equal(doc);
  });

  it("stores every block binary field as bytea and reconstructs it", () => {
    const binary = {
      events: Buffer.from([1]),
      snapshots: Buffer.from([2]),
      txs: Buffer.from([3]),
    };
    const document = {
      hash: "block",
      headers,
      signature: "signature",
      ...binary,
    };
    const values = encode({ kind: "blockchain", document });
    const doc = JSON.parse(values[3]);
    expect(doc).to.deep.equal({
      hash: "block",
      headers,
      signature: "signature",
    });
    expect(values.slice(-3)).to.deep.equal(Object.values(binary));
    expect(
      decode({ kind: "blockchain", row: { doc, ...binary } })
    ).to.deep.equal(document);
  });

  it("converts only counter bigint/date metadata back to its public shape", () => {
    expect(
      decode({
        kind: "counts",
        row: { root: "root", value: "12", updated: new Date(headers.created) },
      })
    ).to.deep.equal({ root: "root", value: 12, updated: headers.created });
  });
});
