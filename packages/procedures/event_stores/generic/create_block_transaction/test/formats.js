import { strict as assert } from "node:assert";
import { replace, restore } from "sinon";
import { decode } from "@blossm/rlp";
import hash from "@blossm/hash";
import createBlock from "../index.js";
import deps from "../deps.js";

describe("Block canonical format", () => {
  afterEach(restore);
  for (const isPublic of [true, false])
    it(`preserves mixed event history and Boolean snapshots, public=${isPublic}`, async () => {
      const events = [
        {
          hash: "old",
          headers: { number: 0 },
          payload: { enabled: true },
          tx: { id: "tx" },
        },
        {
          hash: "new",
          headers: { number: 1, canonicalFormat: 2 },
          payload: { enabled: false },
          tx: { id: "tx" },
        },
      ];
      replace(deps, "aggregate", () => async () => ({
        headers: { lastEventNumber: 1 },
        events,
        context: {},
        groups: [],
        state: { enabled: false },
        txIds: ["tx"],
      }));
      let snapshot;
      const encrypted = [];
      const { block } = await createBlock({
        latestBlockFn: async () => ({
          hash: "legacy-block",
          headers: { number: 3, end: "2026-01-01T00:00:00.000Z" },
        }),
        rootStreamFn: async ({ fn }) =>
          fn({ root: "r", updated: "2026-01-02T00:00:00.000Z" }),
        saveSnapshotFn: async ({ snapshot: s }) => {
          snapshot = s;
          return s;
        },
        saveBlockFn: async ({ block: b }) => b,
        encryptFn: async (s) => {
          encrypted.push(s);
          return `encrypted:${s}`;
        },
        signFn: async () => "signature",
        blockPublisherPublicKeyFn: async () => "public-key",
        isPublic,
        blockLimit: 100,
      })();
      assert.equal(block.headers.canonicalFormat, 2);
      assert.equal(block.headers.pHash, "legacy-block");
      assert.equal(snapshot.headers.canonicalFormat, 2);
      assert.equal(
        snapshot.headers.sHash,
        "c5d6675dd3e3782f9edc5d568b0db07d6f64a9f23075e2f2c9406084f619d7f0"
      );
      assert.equal(
        snapshot.hash,
        hash(snapshot.headers, { canonicalFormat: 2 }).create()
      );
      assert.equal(
        block.hash,
        hash(block.headers, { canonicalFormat: 2 }).create()
      );
      const exported = decode(block.events).map(([, value]) =>
        JSON.parse(Buffer.from(value).toString())
      );
      assert.deepEqual(
        exported.map((e) => e.headers.canonicalFormat),
        [undefined, 2]
      );
      if (isPublic)
        assert.deepEqual(
          exported.map((e) => e.payload),
          [{ enabled: true }, { enabled: false }]
        );
      else
        assert.deepEqual(encrypted.sort(), [
          '{"enabled":false}',
          '{"enabled":false}',
          '{"enabled":true}',
        ]);
      const [exportedSnapshot] = decode(block.snapshots).map(([, value]) =>
        JSON.parse(Buffer.from(value).toString())
      );
      assert.equal(exportedSnapshot.headers.canonicalFormat, 2);
      assert.deepEqual(
        exportedSnapshot.state,
        isPublic ? { enabled: false } : 'encrypted:{"enabled":false}'
      );
    });
  it("refuses a legacy block after activation or over pending format 2 events", async () => {
    await assert.rejects(createBlock({ canonicalFormat: 1,
      latestBlockFn: async () => ({ headers: { canonicalFormat: 2 } }),
    })(), /Cannot append a legacy block/);
    replace(deps, "aggregate", () => async () => ({ events: [{ headers: { canonicalFormat: 2 } }] }));
    await assert.rejects(createBlock({ canonicalFormat: 1,
      latestBlockFn: async () => ({ headers: { number: 0, end: "2026-01-01" } }),
      rootStreamFn: async ({ fn }) => fn({ root: "r", updated: "2026-01-02" }),
      blockLimit: 100,
    })(), /Cannot export canonical format 2 events/);
  });

});
