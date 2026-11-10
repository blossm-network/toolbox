import { strict as assert } from "node:assert";
import { decode } from "@blossm/rlp";
import hash from "@blossm/hash";
import createBlock from "../index.js";
import post from "@blossm/event-store-post-transaction";
import { root as merkleRoot, verify } from "@blossm/merkle-tree";

describe("Block canonical commitments", () => {
  for (const isPublic of [true, false])
    it(`preserves Boolean event exports and snapshots, public=${isPublic}`, async () => {
      let events;
      await post({
        eventData: [true, false].map((enabled) => ({
          event: {
            headers: {
              root: "r",
              action: "set",
              created: "2026-01-02T00:00:00.000Z",
              domain: process.env.DOMAIN,
              service: process.env.SERVICE,
              network: process.env.NETWORK,
            },
            payload: { enabled },
          },
        })),
        tx: { id: "tx" },
        reserveRootCountsFn: async () => ({ root: "r", value: 2 }),
        saveEventsFn: async ({ events: saved }) => {
          events = saved;
        },
      })();
      let snapshot;
      const encrypted = [];
      const { block } = await createBlock({
        latestBlockFn: async () => ({
          hash: "previous-block",
          headers: { number: 3, end: "2026-01-01T00:00:00.000Z" },
        }),
        rootStreamFn: async ({ fn }) =>
          fn({ root: "r", updated: "2026-01-02T00:00:00.000Z" }),
        findOneSnapshotFn: async () => null,
        eventStreamFn: async ({ fn }) => {
          for (const event of events) await fn(event);
        },
        handlers: { set: (_, payload) => payload },
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
      assert.equal(block.headers.pHash, "previous-block");
      assert.equal(
        snapshot.headers.sHash,
        "c5d6675dd3e3782f9edc5d568b0db07d6f64a9f23075e2f2c9406084f619d7f0"
      );
      assert.equal(snapshot.hash, hash(snapshot.headers).create());
      assert.equal(block.hash, hash(block.headers).create());
      for (const [field, rootField] of [
        ["events", "eRoot"],
        ["snapshots", "sRoot"],
        ["txs", "tRoot"],
      ]) {
        const pairs = decode(block[field]).map((pair) =>
          pair.map((value) => Buffer.from(value).toString())
        );
        assert.equal(
          (await merkleRoot(pairs)).toString("base64"),
          block.headers[rootField]
        );
        for (const [key, value] of pairs)
          assert.equal(
            await verify({
              pairs,
              key,
              value,
              root: Buffer.from(block.headers[rootField], "base64"),
            }),
            true
          );
      }
      const exported = decode(block.events).map(([, value]) =>
        JSON.parse(Buffer.from(value).toString())
      );
      for (const event of exported) {
        const payload = isPublic
          ? event.payload
          : JSON.parse(event.payload.slice("encrypted:".length));
        assert.equal(hash(payload).create(), event.headers.pHash);
        assert.equal(hash(event.headers).create(), event.hash);
      }
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
      assert.deepEqual(
        exportedSnapshot.state,
        isPublic ? { enabled: false } : 'encrypted:{"enabled":false}'
      );
    });
});
